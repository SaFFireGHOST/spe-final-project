import asyncio
import grpc
from lastmile.v1 import driver_pb2, driver_pb2_grpc
from common.run import serve
from common.db import get_db
# this is driver service
class DriverStore:
    def __init__(self):
        self.lock = asyncio.Lock()
        self.routes: dict[str, driver_pb2.DriverRoute] = {}

class DriverServer(driver_pb2_grpc.DriverServiceServicer):
    def __init__(self):
        self.db = get_db()
        self.routes = self.db.driver_routes

    async def RegisterRoute(self, request, context):
        print(f"[driver] RegisterRoute request={request}")
        r = request.route
        
        # Convert stations to dict list for storage
        stations_data = []
        for s in r.stations:
            stations_data.append({
                "station_id": s.station_id,
                "minutes_before_eta_match": s.minutes_before_eta_match
            })
            
        route_doc = {
            "driver_id": r.driver_id,
            "dest_area": r.dest_area,
            "seats_total": r.seats_total,
            "seats_free": r.seats_free,
            "stations": stations_data
        }
        
        res = self.routes.insert_one(route_doc)
        rid = str(res.inserted_id)
        
        nr = driver_pb2.DriverRoute(
            id=rid, driver_id=r.driver_id, dest_area=r.dest_area,
            seats_total=r.seats_total, seats_free=route_doc["seats_free"], stations=list(r.stations)
        )
        return driver_pb2.RegisterRouteResponse(route=nr)

    async def UpdateSeats(self, request, context):
        print(f"[driver] UpdateSeats request={request}")
        from bson.objectid import ObjectId
        try:
            oid = ObjectId(request.route_id)
            res = self.routes.find_one_and_update(
                {"_id": oid},
                {"$set": {"seats_free": request.seats_free}},
                return_document=True
            )
        except:
            res = None
            
        if not res:
            return driver_pb2.UpdateSeatsResponse()
            
        # Reconstruct proto
        stations_pb = [driver_pb2.RouteStation(station_id=s["station_id"], minutes_before_eta_match=s["minutes_before_eta_match"]) for s in res["stations"]]
        
        r = driver_pb2.DriverRoute(
            id=str(res["_id"]),
            driver_id=res["driver_id"],
            dest_area=res["dest_area"],
            seats_total=res["seats_total"],
            seats_free=res["seats_free"],
            stations=stations_pb
        )
        return driver_pb2.UpdateSeatsResponse(route=r)

    async def GetRoute(self, request, context):
        print(f"[driver] GetRoute request={request}")
        from bson.objectid import ObjectId
        try:
            oid = ObjectId(request.route_id)
            res = self.routes.find_one({"_id": oid})
        except:
            res = None
            
        if not res:
            return driver_pb2.GetRouteResponse()
            
        stations_pb = [driver_pb2.RouteStation(station_id=s["station_id"], minutes_before_eta_match=s["minutes_before_eta_match"]) for s in res["stations"]]
        
        r = driver_pb2.DriverRoute(
            id=str(res["_id"]),
            driver_id=res["driver_id"],
            dest_area=res["dest_area"],
            seats_total=res["seats_total"],
            seats_free=res["seats_free"],
            stations=stations_pb
        )
        return driver_pb2.GetRouteResponse(route=r)

    async def DeleteRoute(self, request, context):
        print(f"[driver] DeleteRoute request={request}")
        from bson.objectid import ObjectId
        try:
            oid = ObjectId(request.route_id)
            res = self.routes.delete_one({"_id": oid})
        except Exception as e:
            print(f"[driver] DeleteRoute error: {e}")
            
        return driver_pb2.DeleteRouteResponse(route_id=request.route_id)

def factory():
    server = grpc.aio.server()
    driver_pb2_grpc.add_DriverServiceServicer_to_server(DriverServer(), server)
    return server

if __name__ == "__main__":
    serve(factory, "[::]:50053")
