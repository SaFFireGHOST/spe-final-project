import pytest
from unittest.mock import MagicMock, patch
from services.trip_svc import TripServer
from lastmile.v1 import trip_pb2, common_pb2

@pytest.fixture
def trip_server():
    with patch('services.trip_svc.get_db') as mock_get_db:
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        server = TripServer()
        server.trips = mock_db.trips
        return server

@pytest.mark.asyncio
async def test_create_trip(trip_server):
    trip_server.trips.insert_one.return_value.inserted_id = "t1"
    
    request = trip_pb2.CreateTripRequest(
        driver_id="d1", route_id="rt1", station_id="s1", rider_ids=["r1"]
    )
    response = await trip_server.CreateTrip(request, None)
    
    assert response.trip.id == "t1"

@pytest.mark.asyncio
async def test_update_trip_status(trip_server):
    trip_server.trips.find_one_and_update.return_value = {
        "_id": "507f1f77bcf86cd799439011", "driver_id": "d1", "route_id": "rt1", "station_id": "s1", "status": "ACTIVE", "rider_ids": []
    }
    
    request = trip_pb2.UpdateTripStatusRequest(trip_id="507f1f77bcf86cd799439011", status="ACTIVE")
    response = await trip_server.UpdateTripStatus(request, None)
    
    assert response.trip.id == "507f1f77bcf86cd799439011"
    assert response.trip.status == "ACTIVE"
