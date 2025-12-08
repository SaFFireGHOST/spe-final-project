import asyncio
import grpc
from lastmile.v1 import trip_pb2, trip_pb2_grpc, common_pb2, notification_pb2, notification_pb2_grpc
from common.run import serve
from common.env import addr
from common.db import get_db

class TripStore:
    def __init__(self):
        self.lock = asyncio.Lock()
        self.trips: dict[str, common_pb2.Trip] = {}
        self._seq = 0

class TripServer(trip_pb2_grpc.TripServiceServicer):
    def __init__(self):
        self.db = get_db()
        self.trips = self.db.trips
        
        # Connect to Notification Service
        self._notify_addr = addr("NOTIFY_ADDR", "localhost:50056")
        self._notify_ch = grpc.aio.insecure_channel(self._notify_addr)
        self.notify = notification_pb2_grpc.NotificationServiceStub(self._notify_ch)

    async def CreateTrip(self, request, context):
        print(f"[trip] CreateTrip request={request}")
        
        trip_doc = {
            "driver_id": request.driver_id,
            "rider_ids": list(request.rider_ids),
            "route_id": request.route_id,
            "station_id": request.station_id,
            "status": "SCHEDULED"
        }
        res = self.trips.insert_one(trip_doc)
        tid = str(res.inserted_id)
        
        t = common_pb2.Trip(
            id=tid, driver_id=request.driver_id, rider_ids=list(request.rider_ids),
            route_id=request.route_id, station_id=request.station_id, status="SCHEDULED"
        )
        return trip_pb2.CreateTripResponse(trip=t)

    async def UpdateTripStatus(self, request, context):
        print(f"[trip] UpdateTripStatus request={request}")
        from bson.objectid import ObjectId
        try:
            oid = ObjectId(request.trip_id)
            res = self.trips.find_one_and_update(
                {"_id": oid},
                {"$set": {"status": request.status}},
                return_document=True
            )
            print(res)
        except:
            res = None
            
        if not res:
            return trip_pb2.UpdateTripStatusResponse()
            
        # If status is COMPLETED, delete the associated route
        if request.status == "COMPLETED":
            route_id = res.get("route_id")
            if route_id:
                print(f"[trip] Deleting route {route_id} for completed trip {oid}")
                # We need to access driver_routes collection. 
                # Since we only initialized self.trips, let's get the db again or access it
                self.db.driver_routes.delete_one({"_id": ObjectId(route_id)})
            
            # Also mark rider requests as COMPLETED
            rider_ids = res.get("rider_ids", [])
            if rider_ids:
                print(f"[trip] Marking rider requests for riders {rider_ids} as COMPLETED")
                # We assume one active request per rider for now, or we could filter by station/time if needed.
                # But simply marking all non-completed requests for these riders as COMPLETED is a safe heuristic for this MVP.
                self.db.rider_requests.update_many(
                    {"rider_id": {"$in": rider_ids}, "status": {"$ne": "COMPLETED"}},
                    {"$set": {"status": "COMPLETED"}}
                )
                
                # Send notification to riders
                try:
                    targets = [notification_pb2.PushTarget(user_id=rid, channel="log") for rid in rider_ids]
                    await self.notify.Push(notification_pb2.PushRequest(
                        targets=targets, 
                        title="Trip Completed", 
                        body="You have arrived at your destination. Thank you for riding with LastMile!",
                        data_json=f'{{"tripId":"{request.trip_id}", "status":"COMPLETED"}}'
                    ))
                    print(f"[trip] Sent completion notification to {len(rider_ids)} riders")
                except Exception as e:
                    print(f"[trip] Failed to send notification: {e}")

        t = common_pb2.Trip(
            id=str(res["_id"]),
            driver_id=res["driver_id"],
            rider_ids=res["rider_ids"],
            route_id=res["route_id"],
            station_id=res["station_id"],
            status=res["status"]
        )
        return trip_pb2.UpdateTripStatusResponse(trip=t)

def factory():
    server = grpc.aio.server()
    trip_pb2_grpc.add_TripServiceServicer_to_server(TripServer(), server)
    return server

if __name__ == "__main__":
    serve(factory, "[::]:50055")
