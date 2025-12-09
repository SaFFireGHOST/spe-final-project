import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from services.location_svc import LocationServer
from lastmile.v1 import location_pb2, driver_pb2, station_pb2, matching_pb2, common_pb2

@pytest.fixture
def location_server():
    # LocationServer does NOT use get_db, it uses grpc stubs.
    # We need to mock the stubs.
    with patch('grpc.aio.insecure_channel'), \
         patch('lastmile.v1.matching_pb2_grpc.MatchingServiceStub') as MockMatch, \
         patch('lastmile.v1.station_pb2_grpc.StationServiceStub') as MockStation, \
         patch('lastmile.v1.driver_pb2_grpc.DriverServiceStub') as MockDriver:
        
        server = LocationServer()
        server.match = MockMatch.return_value
        server.station = MockStation.return_value
        server.driver = MockDriver.return_value
        return server

@pytest.mark.asyncio
async def test_stream_driver_location(location_server):
    # Mock driver route
    location_server.driver.GetRoute = AsyncMock(return_value=driver_pb2.GetRouteResponse(
        route=driver_pb2.DriverRoute(
            id="rt1", 
            stations=[driver_pb2.RouteStation(station_id="s1", minutes_before_eta_match=10)]
        )
    ))
    
    # Mock station location
    location_server.station.GetStation = AsyncMock(return_value=station_pb2.GetStationResponse(
        station=common_pb2.Station(
            id="s1", location=common_pb2.LatLng(lat=10.0, lon=20.0)
        )
    ))
    
    # Mock matching response
    location_server.match.TryMatch = AsyncMock(return_value=matching_pb2.TryMatchResponse(trip_id="t1"))

    # Create an async iterator for the request stream
    async def request_iterator():
        yield location_pb2.DriverLocation(
            driver_id="d1", 
            point=common_pb2.LatLng(lat=10.0, lon=20.0), # Same location as station
            ts_unix=1000, 
            route_id="rt1"
        )

    response = await location_server.StreamDriverLocation(request_iterator(), None)
    
    assert response.ok is True
