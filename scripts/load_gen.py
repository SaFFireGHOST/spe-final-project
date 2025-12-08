import grpc
import time
import threading
import sys
import os

# Add parent directory to path to import generated protos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from lastmile.v1 import matching_pb2, matching_pb2_grpc

def run_load():
    target = os.environ.get('TARGET_ADDR', 'localhost:50057')
    # print(f"Starting load generation on {target}...") # Moved to main to avoid spam

    while True:
        try:
            # Re-create channel periodically to force re-balancing (L4 LB workaround)
            with grpc.insecure_channel(target) as channel:
                stub = matching_pb2_grpc.MatchingServiceStub(channel)
                
                # Send a batch of requests per connection
                for _ in range(50):
                    try:
                        # Send a dummy request
                        stub.TryMatch(matching_pb2.TryMatchRequest(
                            driver_id="d1", 
                            route_id="r1", 
                            station_id="s1", 
                            arrival_eta_unix=int(time.time())
                        ))
                    except grpc.RpcError:
                        pass
                    except Exception as e:
                        print(f"Error sending request: {e}")
                        time.sleep(1)
        except Exception as e:
            print(f"Connection error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    threads = []
    # Launch 20 threads to generate enough load
    for i in range(20):
        t = threading.Thread(target=run_load)
        t.daemon = True
        t.start()
        threads.append(t)

    print("Load generator running. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping...")
