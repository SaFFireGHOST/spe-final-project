import grpc
from time import time
from lastmile.v1 import (
    matching_pb2, matching_pb2_grpc,
    driver_pb2, driver_pb2_grpc,
    rider_pb2, rider_pb2_grpc,
    trip_pb2, trip_pb2_grpc,
    notification_pb2, notification_pb2_grpc,
)
from common.env import addr
from common.run import serve

class MatchingServer(matching_pb2_grpc.MatchingServiceServicer):
    def __init__(self):
        self._driver_addr = addr("DRIVER_ADDR", "localhost:50053")
        self._rider_addr  = addr("RIDER_ADDR", "localhost:50054")
        self._trip_addr   = addr("TRIP_ADDR",  "localhost:50055")
        self._notify_addr = addr("NOTIFY_ADDR","localhost:50056")

        self._driver_ch = grpc.aio.insecure_channel(self._driver_addr)
        self._rider_ch  = grpc.aio.insecure_channel(self._rider_addr)
        self._trip_ch   = grpc.aio.insecure_channel(self._trip_addr)
        self._notify_ch = grpc.aio.insecure_channel(self._notify_addr)

        self.driver = driver_pb2_grpc.DriverServiceStub(self._driver_ch)
        self.rider  = rider_pb2_grpc.RiderServiceStub(self._rider_ch)
        self.trip   = trip_pb2_grpc.TripServiceStub(self._trip_ch)
        self.notify = notification_pb2_grpc.NotificationServiceStub(self._notify_ch)

    async def TryMatch(self, request, context):
        print(f"[matching] TryMatch request={request}")
        ro = await self.driver.GetRoute(driver_pb2.GetRouteRequest(route_id=request.route_id))
        route = ro.route
        if not route or route.seats_free <= 0 or not route.dest_area:
            return matching_pb2.TryMatchResponse(seats_remaining=route.seats_free if route else 0)

        now = int(time())
        rs = await self.rider.ListPendingAtStation(rider_pb2.ListPendingAtStationRequest(
            station_id=request.station_id, now_unix=now, minutes_window=12, dest_area=route.dest_area
        ))
        riders = list(rs.requests)
        if not riders:
            return matching_pb2.TryMatchResponse(seats_remaining=route.seats_free)

        riders.sort(key=lambda r: (abs(r.eta_unix - request.arrival_eta_unix), r.eta_unix))
        k = min(len(riders), route.seats_free)
        chosen = riders[:k]

        rider_ids = [r.rider_id for r in chosen]
        req_ids   = [r.id for r in chosen]

        ct = await self.trip.CreateTrip(trip_pb2.CreateTripRequest(
            driver_id=request.driver_id, rider_ids=rider_ids,
            route_id=request.route_id, station_id=request.station_id
        ))
        trip = ct.trip

        await self.rider.MarkAssigned(rider_pb2.MarkAssignedRequest(request_ids=req_ids, trip_id=trip.id))
        left = max(route.seats_free - k, 0)
        await self.driver.UpdateSeats(driver_pb2.UpdateSeatsRequest(route_id=route.id, seats_free=left))

        targets = [notification_pb2.PushTarget(user_id=route.driver_id, channel="log")]
        targets += [notification_pb2.PushTarget(user_id=rid, channel="log") for rid in rider_ids]
        await self.notify.Push(notification_pb2.PushRequest(
            targets=targets, title="Match confirmed", body="Your LastMile ride is scheduled.",
            data_json=f'{{"tripId":"{trip.id}"}}'
        ))

        assignments = [matching_pb2.Assignment(rider_request_id=r.id, rider_id=r.rider_id) for r in chosen]
        return matching_pb2.TryMatchResponse(trip_id=trip.id, assignments=assignments, seats_remaining=left)

def factory():
    server = grpc.aio.server()
    matching_pb2_grpc.add_MatchingServiceServicer_to_server(MatchingServer(), server)
    return server

if __name__ == "__main__":
    serve(factory, "[::]:50057")
