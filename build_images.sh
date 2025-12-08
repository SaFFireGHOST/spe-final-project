#!/bin/bash

# Build all docker images
docker build -f Dockerfile.user -t user-svc:latest .
docker build -f Dockerfile.station -t station-svc:latest .
docker build -f Dockerfile.driver -t driver-svc:latest .
docker build -f Dockerfile.rider -t rider-svc:latest .
docker build -f Dockerfile.trip -t trip-svc:latest .
docker build -f Dockerfile.notification -t notification-svc:latest .
docker build -f Dockerfile.matching -t matching-svc:latest .
docker build -f Dockerfile.location -t location-svc:latest .
docker build -f Dockerfile.gateway -t gateway-svc:latest .
docker build -t lastmile-frontend:latest -f frontend/Dockerfile frontend/
