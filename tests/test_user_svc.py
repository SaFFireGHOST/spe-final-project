import pytest
from unittest.mock import MagicMock, patch
from services.user_svc import UserServer
from lastmile.v1 import user_pb2, common_pb2

@pytest.fixture
def user_server():
    with patch('services.user_svc.get_db') as mock_get_db:
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        server = UserServer()
        server.users = mock_db.users # Explicitly set the mock collection
        return server

@pytest.mark.asyncio
async def test_create_user(user_server):
    # Mock request
    request = user_pb2.CreateUserRequest(
        user=common_pb2.User(role=common_pb2.RIDER, name="Test Rider", phone="1234567890"),
        password="password123"
    )
    
    # Mock DB insert
    mock_result = MagicMock()
    mock_result.inserted_id = "507f1f77bcf86cd799439011"
    user_server.users.insert_one.return_value = mock_result

    # Call method
    response = await user_server.CreateUser(request, None)

    # Assertions
    assert response.user.id == "507f1f77bcf86cd799439011"
    assert response.user.name == "Test Rider"
    user_server.users.insert_one.assert_called_once()

@pytest.mark.asyncio
async def test_authenticate_success(user_server):
    # Mock request
    request = user_pb2.AuthenticateRequest(phone="1234567890", password="password123")
    
    # Mock DB find
    user_server.users.find_one.return_value = {
        "_id": "507f1f77bcf86cd799439011",
        "phone": "1234567890",
        "password": "password123"
    }

    # Call method
    response = await user_server.Authenticate(request, None)

    # Assertions
    assert response.user_id == "507f1f77bcf86cd799439011"
    assert response.jwt == "demo-jwt"

@pytest.mark.asyncio
async def test_authenticate_failure(user_server):
    # Mock request
    request = user_pb2.AuthenticateRequest(phone="1234567890", password="wrongpassword")
    
    # Mock DB find
    user_server.users.find_one.return_value = {
        "_id": "507f1f77bcf86cd799439011",
        "phone": "1234567890",
        "password": "password123"
    }

    # Call method
    response = await user_server.Authenticate(request, None)

    # Assertions
    assert response.user_id == ""
    assert response.jwt == ""
