import pytest
from unittest.mock import MagicMock, patch
from services.rider_svc import RiderServer
from lastmile.v1 import rider_pb2, common_pb2

@pytest.fixture
def rider_server():
    with patch('services.rider_svc.get_db') as mock_get_db:
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        server = RiderServer()
        server.rider_requests = mock_db.rider_requests
        return server

@pytest.mark.asyncio
async def test_add_request(rider_server):
    rider_server.requests.insert_one.return_value.inserted_id = "req1"
    
    req = common_pb2.RiderRequest(
        rider_id="r1", station_id="s1", dest_area="Area A", eta_unix=1000
    )
    request = rider_pb2.AddRequestRequest(request=req)
    response = await rider_server.AddRequest(request, None)
    
    assert response.request.id == "req1"
    assert response.request.rider_id == "r1"

@pytest.mark.asyncio
async def test_list_pending_at_station(rider_server):
    # Mock find to return a list of docs
    mock_cursor = [
        {"_id": "req1", "rider_id": "r1", "station_id": "s1", "dest_area": "Area A", "status": "PENDING", "eta_unix": 1000}
    ]
    rider_server.requests.find.return_value.sort.return_value = mock_cursor
    
    request = rider_pb2.ListPendingAtStationRequest(
        station_id="s1", now_unix=1000, minutes_window=10, dest_area="Area A"
    )
    response = await rider_server.ListPendingAtStation(request, None)
    
    assert len(response.requests) == 1
    assert response.requests[0].id == "req1"
