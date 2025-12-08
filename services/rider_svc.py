import asyncio
import time
import grpc
from lastmile.v1 import rider_pb2, rider_pb2_grpc, common_pb2
from common.run import run_grpc  
from common.db import get_db

class RiderStore:
    def __init__(self):
        self.lock = asyncio.Lock()
        self.requests: dict[str, common_pb2.RiderRequest] = {}
        self.by_station: dict[str, set[str]] = {}

class RiderServer(rider_pb2_grpc.RiderServiceServicer):
    def __init__(self):
        self.db = get_db()
        self.requests = self.db.rider_requests

    async def AddRequest(self, request, context):
        print(f"[rider] AddRequest request={request}")
        r = request.request
        
        req_doc = {
            "rider_id": r.rider_id,
            "station_id": r.station_id,
            "eta_unix": r.eta_unix,
            "dest_area": r.dest_area,
            "status": r.status or "PENDING"
        }
        res = self.requests.insert_one(req_doc)
        rid = str(res.inserted_id)
        
        req = common_pb2.RiderRequest(
            id=rid, rider_id=r.rider_id, station_id=r.station_id,
            eta_unix=r.eta_unix, dest_area=r.dest_area,
            status=req_doc["status"],
        )
        return rider_pb2.AddRequestResponse(request=req)

    async def ListPendingAtStation(self, request, context):
        print(f"[rider] ListPendingAtStation request={request}")
        now = request.now_unix
        window = request.minutes_window
        lo, hi = now - window*60, now + window*60

        query = {
            "station_id": request.station_id,
            "dest_area": request.dest_area,
            "status": "PENDING",
            "eta_unix": {"$gte": lo, "$lte": hi}
        }
        
        out = []
        cursor = self.requests.find(query).sort("eta_unix", 1)
        for doc in cursor:
            out.append(common_pb2.RiderRequest(
                id=str(doc["_id"]),
                rider_id=doc["rider_id"],
                station_id=doc["station_id"],
                eta_unix=doc["eta_unix"],
                dest_area=doc["dest_area"],
                status=doc["status"]
            ))
            
        return rider_pb2.ListPendingAtStationResponse(requests=out)

    async def MarkAssigned(self, request, context):
        print(f"[rider] MarkAssigned request={request}")
        from bson.objectid import ObjectId
        n = 0
        for rid in request.request_ids:
            try:
                oid = ObjectId(rid)
                res = self.requests.update_one(
                    {"_id": oid, "status": "PENDING"},
                    {"$set": {"status": "ASSIGNED", "trip_id": request.trip_id}}
                )
                if res.modified_count > 0:
                    n += 1
            except:
                pass
        return rider_pb2.MarkAssignedResponse(updated=n)

    # --- New Background Task ---
    async def cleanup_expired_requests(self):
        print("[rider] Starting background cleanup task...")
        while True:
            try:
                # 10 minutes (600 seconds) tolerance
                # If ETA was 10:00, and it is now 10:11, we delete it.
                # Logic: Delete if (eta_unix + 600) < now  =>  eta_unix < (now - 600)
                cutoff_unix = int(time.time()) - 600
                
                result = self.requests.delete_many({
                    "status": "PENDING",
                    "eta_unix": {"$lt": cutoff_unix}
                })
                
                if result.deleted_count > 0:
                    print(f"[rider] Cleaned up {result.deleted_count} expired requests (ETA + 10m passed).")
            
            except Exception as e:
                print(f"[rider] Error in cleanup task: {e}")
            
            # Check every 60 seconds
            await asyncio.sleep(60)

async def main():
    server = grpc.aio.server()
    rider_svc = RiderServer()
    rider_pb2_grpc.add_RiderServiceServicer_to_server(rider_svc, server)
    
    # Start the cleanup loop as a background task
    cleanup_task = asyncio.create_task(rider_svc.cleanup_expired_requests())
    
    try:
        # Use run_grpc helper to start server and wait for termination
        await run_grpc(server, "[::]:50054")
    finally:
        # Ensure task is cancelled on exit
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass

if __name__ == "__main__":
    asyncio.run(main())