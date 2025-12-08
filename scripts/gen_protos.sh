#!/usr/bin/env bash
set -euo pipefail
python -m grpc_tools.protoc   -I api/proto   --python_out=.   --grpc_python_out=.   api/proto/lastmile/v1/common.proto   api/proto/lastmile/v1/user.proto   api/proto/lastmile/v1/station.proto   api/proto/lastmile/v1/driver.proto   api/proto/lastmile/v1/rider.proto   api/proto/lastmile/v1/location.proto   api/proto/lastmile/v1/trip.proto   api/proto/lastmile/v1/notification.proto   api/proto/lastmile/v1/matching.proto
