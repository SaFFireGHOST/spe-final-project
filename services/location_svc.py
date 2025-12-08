# services/location_svc.py
import time
import grpc
from lastmile.v1 import (
    location_pb2, location_pb2_grpc,
    matching_pb2, matching_pb2_grpc,
    station_pb2, station_pb2_grpc,
    driver_pb2, driver_pb2_grpc,
    common_pb2,
)
from common.geo import haversine_m
from common.env import addr
from common.run import serve

# Tunables (no speed/ETA used)
GEOFENCE_METERS  = 400.0   # trigger radius around a station
DEBOUNCE_SECONDS = 30      # suppress repeated triggers per (driver, station)

class LocationServer(location_pb2_grpc.LocationServiceServicer):
    def __init__(self):
        self._match_addr   = addr("MATCH_ADDR",   "localhost:50057")
        self._station_addr = addr("STATION_ADDR", "localhost:50052")
        self._driver_addr  = addr("DRIVER_ADDR",  "localhost:50053")

        self._match_ch   = grpc.aio.insecure_channel(self._match_addr)
        self._station_ch = grpc.aio.insecure_channel(self._station_addr)
        self._driver_ch  = grpc.aio.insecure_channel(self._driver_addr)

        self.match   = matching_pb2_grpc.MatchingServiceStub(self._match_ch)
        self.station = station_pb2_grpc.StationServiceStub(self._station_ch)
        self.driver  = driver_pb2_grpc.DriverServiceStub(self._driver_ch)

        # small caches
        self._station_coord_cache: dict[str, common_pb2.LatLng] = {}   # station_id -> LatLng
        self._route_cache: dict[str, driver_pb2.DriverRoute] = {}      # route_id -> DriverRoute
        self._last_trigger: dict[tuple[str, str], float] = {}          # (driver_id, station_id) -> ts

    async def _get_station_coord(self, station_id: str) -> common_pb2.LatLng | None:
        if station_id in self._station_coord_cache:
            return self._station_coord_cache[station_id]
        resp = await self.station.GetStation(station_pb2.GetStationRequest(id=station_id))
        if resp and resp.station and resp.station.location:
            self._station_coord_cache[station_id] = resp.station.location
            return resp.station.location
        return None

    async def _get_route(self, route_id: str) -> driver_pb2.DriverRoute | None:
        if route_id in self._route_cache:
            return self._route_cache[route_id]
        ro = await self.driver.GetRoute(driver_pb2.GetRouteRequest(route_id=route_id))
        if ro and ro.route and ro.route.id:
            self._route_cache[route_id] = ro.route
            return ro.route
        return None

    def _debounced(self, driver_id: str, station_id: str, now: float) -> bool:
        key = (driver_id, station_id)
        last = self._last_trigger.get(key, 0.0)
        if now - last < DEBOUNCE_SECONDS:
            return True
        self._last_trigger[key] = now
        return False

    async def StreamDriverLocation(self, request_iterator, context):
        async for loc in request_iterator:
            print(f"[location] StreamDriverLocation received loc={loc}")
            route = await self._get_route(loc.route_id)
            if not route or not route.stations:
                # No registered stations — nothing to check
                continue

            # Check proximity for every station on the route
            for rs in route.stations:
                station_id = rs.station_id
                st = await self._get_station_coord(station_id)
                if not st:
                    continue

                # Distance between driver and station
                dist_m = haversine_m(loc.point.lat, loc.point.lon, st.lat, st.lon)
                if dist_m > GEOFENCE_METERS:
                    continue

                # --- NEW: ETA based on distance ---
                AVG_SPEED_MPS = 10  # approx driving speed in m/s   
                eta_minutes = (dist_m / AVG_SPEED_MPS) / 60.0

                # If ETA is greater than allowed minutes_before_eta_match → skip
                if eta_minutes > rs.minutes_before_eta_match:
                    continue    

                now = time.time()
                if self._debounced(loc.driver_id, station_id, now):
                    continue

                # Trigger match
                resp = await self.match.TryMatch(matching_pb2.TryMatchRequest(
                    driver_id=loc.driver_id,
                    route_id=loc.route_id,
                    station_id=station_id,
                    arrival_eta_unix=int(loc.ts_unix),
                ))
                if resp.trip_id:
                    print(f"[location] matched at {station_id}: trip={resp.trip_id}, seats_left={resp.seats_remaining}")

        return location_pb2.LocationStreamAck(ok=True)

def factory():
    server = grpc.aio.server()
    location_pb2_grpc.add_LocationServiceServicer_to_server(LocationServer(), server)
    return server

if __name__ == "__main__":
    serve(factory, "[::]:50058")
