import pytest
from unittest.mock import MagicMock, patch
from services.notification_svc import NotificationServer
from lastmile.v1 import notification_pb2

@pytest.fixture
def notification_server():
    with patch('services.notification_svc.get_db') as mock_get_db:
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        server = NotificationServer()
        server.notifications = mock_db.notifications
        return server

@pytest.mark.asyncio
async def test_push_notification(notification_server):
    notification_server.notifications.insert_many.return_value = None # insert_many returns InsertManyResult, but we don't check it
    
    target = notification_pb2.PushTarget(user_id="u1", channel="log")
    request = notification_pb2.PushRequest(
        targets=[target], title="Hello", body="World"
    )
    response = await notification_server.Push(request, None)
    
    assert response.success == 1
