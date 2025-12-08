import os

def addr(env_name: str, default: str) -> str:
    v = os.getenv(env_name)
    return v if v else default
