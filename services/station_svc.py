import asyncio
import grpc
from lastmile.v1 import station_pb2, station_pb2_grpc, common_pb2
from common.run import serve
from common.db import get_db

class StationServer(station_pb2_grpc.StationServiceServicer):
    def __init__(self):
        self.db = get_db()
        self.stations = self.db.stations

    async def UpsertStation(self, request, context):
        print(f"[station] UpsertStation request={request}")
        s = request.station
        # Use provided ID or generate one. Station IDs are often semantic (e.g. "MG_ROAD"), so we might want to keep that as _id or a separate field.
        # The current code used `sid = s.id or f"st_{s.name}"`.
        # Let's use `id` as `_id` if provided, otherwise generate.
        
        sid = s.id or f"st_{s.name.replace(' ', '_')}"
        
        doc = {
            "_id": sid,
            "name": s.name,
            "location": {"lat": s.location.lat, "lon": s.location.lon},
            "nearby_areas": list(s.nearby_areas)
        }
        
        self.stations.replace_one({"_id": sid}, doc, upsert=True)
        
        ns = common_pb2.Station(
            id=sid, name=s.name, location=s.location, nearby_areas=list(s.nearby_areas)
        )
        return station_pb2.UpsertStationResponse(station=ns)

    async def GetStation(self, request, context):
        print(f"[station] GetStation request={request}")
        doc = self.stations.find_one({"_id": request.id})
        st = None
        if doc:
            st = common_pb2.Station(
                id=doc["_id"],
                name=doc["name"],
                location=common_pb2.LatLng(lat=doc["location"]["lat"], lon=doc["location"]["lon"]),
                nearby_areas=doc["nearby_areas"]
            )
        return station_pb2.GetStationResponse(station=st)

    async def ListStations(self, request, context):
        print(f"[station] ListStations request={request}")
        out = []
        for doc in self.stations.find():
            out.append(common_pb2.Station(
                id=doc["_id"],
                name=doc["name"],
                location=common_pb2.LatLng(lat=doc["location"]["lat"], lon=doc["location"]["lon"]),
                nearby_areas=doc["nearby_areas"]
            ))
        return station_pb2.ListStationsResponse(stations=out)

    async def NearbyAreas(self, request, context):
        print(f"[station] NearbyAreas request={request}")
        doc = self.stations.find_one({"_id": request.id})
        areas = doc["nearby_areas"] if doc else []
        return station_pb2.NearbyAreasResponse(nearby_areas=areas)

def factory():
    server = grpc.aio.server()
    station_pb2_grpc.add_StationServiceServicer_to_server(StationServer(), server)
    return server

if __name__ == "__main__":
    serve(factory, "[::]:50052")
