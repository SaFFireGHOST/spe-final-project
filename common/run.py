import asyncio
import grpc
from typing import Callable

async def run_grpc(server, host_port: str):
    server.add_insecure_port(host_port)
    await server.start()
    print(f"[grpc] listening on {host_port}")
    await server.wait_for_termination()

def serve(factory: Callable[[], grpc.aio.Server], host_port: str):
    async def _main():
        server = factory()
        await run_grpc(server, host_port)
    asyncio.run(_main())
