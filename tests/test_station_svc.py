import pytest
from unittest.mock import MagicMock, patch
from services.station_svc import StationServer
from lastmile.v1 import station_pb2, common_pb2

@pytest.fixture
def station_server():
    with patch('services.station_svc.get_db') as mock_get_db:
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        server = StationServer()
        server.stations = mock_db.stations
        return server

@pytest.mark.asyncio
async def test_list_stations(station_server):
    # Mock DB
    station_server.stations.find.return_value = [
        {"_id": "s1", "name": "Station 1", "location": {"lat": 10.0, "lon": 20.0}, "nearby_areas": ["A", "B"]},
        {"_id": "s2", "name": "Station 2", "location": {"lat": 11.0, "lon": 21.0}, "nearby_areas": ["C"]}
    ]

    request = common_pb2.Empty()
    response = await station_server.ListStations(request, None)

    assert len(response.stations) == 2
    assert response.stations[0].id == "s1"
    assert response.stations[0].name == "Station 1"
    assert response.stations[1].nearby_areas[0] == "C"

@pytest.mark.asyncio
async def test_get_station_by_id(station_server):
    station_server.stations.find_one.return_value = {
        "_id": "s1", "name": "Station 1", "location": {"lat": 10.0, "lon": 20.0}, "nearby_areas": ["A"]
    }

    request = station_pb2.GetStationRequest(id="s1")
    response = await station_server.GetStation(request, None)

    assert response.station.id == "s1"
    assert response.station.name == "Station 1"
