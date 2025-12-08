import sys
import os
# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import grpc
import time
from lastmile.v1 import notification_pb2, notification_pb2_grpc
from common.run import serve
from common.db import get_db

class NotificationServer(notification_pb2_grpc.NotificationServiceServicer):
    def __init__(self):
        self.db = get_db()

    async def Push(self, request, context):
        print(f"[notification] Push request={request}")
        
        notifications_to_insert = []
        timestamp = int(time.time() * 1000) # ms

        for t in request.targets:
            print(f"[notify] to={t.user_id} via={t.channel} title='{request.title}' body='{request.body}' data={request.data_json}")
            
            # Store in MongoDB
            notifications_to_insert.append({
                "user_id": t.user_id,
                "title": request.title,
                "message": request.body,
                "data": request.data_json,
                "read": False,
                "timestamp": timestamp
            })
            
        if notifications_to_insert:
            self.db.notifications.insert_many(notifications_to_insert)

        return notification_pb2.PushResponse(attempted=len(request.targets), success=len(request.targets))

def factory():
    server = grpc.aio.server()
    notification_pb2_grpc.add_NotificationServiceServicer_to_server(NotificationServer(), server)
    return server

if __name__ == "__main__":
    serve(factory, "[::]:50056")
