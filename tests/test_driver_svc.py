import pytest
from unittest.mock import MagicMock, patch
from services.driver_svc import DriverServer
from lastmile.v1 import driver_pb2, common_pb2

@pytest.fixture
def driver_server():
    with patch('services.driver_svc.get_db') as mock_get_db:
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        server = DriverServer()
        server.drivers = mock_db.drivers
        server.routes = mock_db.routes
        return server

@pytest.mark.asyncio
async def test_register_route(driver_server):
    driver_server.routes.insert_one.return_value.inserted_id = "r1"
    
    # Create a dummy route
    route = driver_pb2.DriverRoute(
        driver_id="d1", dest_area="Area A", seats_total=4, seats_free=4,
        stations=[driver_pb2.RouteStation(station_id="s1", minutes_before_eta_match=10)]
    )
    request = driver_pb2.RegisterRouteRequest(route=route)
    response = await driver_server.RegisterRoute(request, None)
    
    assert response.route.id == "r1"
    assert response.route.driver_id == "d1"

@pytest.mark.asyncio
async def test_get_route(driver_server):
    driver_server.routes.find_one.return_value = {
        "_id": "507f1f77bcf86cd799439011", "driver_id": "d1", "dest_area": "Area A", "seats_total": 4, "seats_free": 4,
        "stations": [{"station_id": "s1", "minutes_before_eta_match": 10}]
    }
    
    request = driver_pb2.GetRouteRequest(route_id="507f1f77bcf86cd799439011")
    response = await driver_server.GetRoute(request, None)
    
    assert response.route.id == "507f1f77bcf86cd799439011"
    assert response.route.driver_id == "d1"
