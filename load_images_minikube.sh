#!/bin/bash

# Load all docker images into Minikube
minikube image load user-svc:latest
minikube image load station-svc:latest
minikube image load driver-svc:latest
minikube image load rider-svc:latest
minikube image load trip-svc:latest
minikube image load notification-svc:latest
minikube image load matching-svc:latest
minikube image load location-svc:latest
minikube image load gateway-svc:latest
minikube image load lastmile-frontend:latest
