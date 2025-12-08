# LastMile — Microservices Demo

A robust, microservices-based ride-sharing application demonstration built with Python, gRPC, and Kubernetes. This project showcases a modern event-driven architecture with real-time updates.

## 🏗️ Architecture

The system is composed of several loosely coupled microservices communicating via gRPC:

*   **User Service**: Manages user profiles and authentication.
*   **Driver Service**: Handles driver availability, location updates, and route management.
*   **Rider Service**: Manages rider requests and status.
*   **Trip Service**: Orchestrates the lifecycle of a trip (creation, updates, completion).
*   **Station Service**: Manages physical station locations for pick-up/drop-off.
*   **Matching Service**: The core logic engine that pairs riders with drivers based on location and availability.
*   **Location Service**: Tracks real-time geospatial data.
*   **Notification Service**: Handles push notifications to users.
*   **Gateway**: An API Gateway (Flask) that exposes REST endpoints to the frontend and routes requests to backend gRPC services.

**Tech Stack:**
*   **Backend**: Python 3.11+, gRPC (asyncio), MongoDB
*   **Frontend**: React, Vite, TailwindCSS
*   **Infrastructure**: Kubernetes, Docker, Helm (optional)

## 🚀 Running the Application

Choose one of the following scenarios to run the application.

### Scenario 1: Running with Kubernetes (Recommended)
**Use this method if you want to see the full system orchestration, including autoscaling and self-healing.** This is the production-like setup.

#### Prerequisites
*   Docker
*   Kubernetes Cluster (Minikube, Kind, or Docker Desktop)
*   `kubectl` CLI tool

#### 1. Build & Load Images
Build the Docker images for all services.

```bash
./build_images.sh
```

> [!IMPORTANT]
> **Minikube Users**: You must load the images into the Minikube VM:
> ```bash
> ./load_images_minikube.sh
> ```

#### 2. Deploy to Cluster
Apply the Kubernetes manifests to start the services and database.

```bash
kubectl apply -f k8s/
```

Wait for all pods to be ready:
```bash
kubectl get pods -w
```

#### 3. Initialize Data
Populate the database with initial station data.

1.  **Port-forward MongoDB** in a separate terminal:
    ```bash
    kubectl port-forward svc/mongo 27018:27017
    ```
2.  **Run the initialization script**:
    ```bash
    python3 scripts/init_db.py
    ```

#### 4. Access the Application
*   **Frontend**: Access via the NodePort or LoadBalancer IP.
    *   Minikube: `minikube service frontend` (usually http://192.168.49.2:30080)
*   **API Gateway**:
    *   Local access via port-forward: `kubectl port-forward svc/gateway 5000:5000` -> http://localhost:5000

---

### Scenario 2: Running Locally (Without Kubernetes)
**Use this method if you are developing a single service and don't want to spin up a full cluster.** You will run each Python service manually in its own terminal.

#### 1. Environment Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

#### 2. Generate Protobufs
```bash
bash scripts/gen_protos.sh
```

#### 3. Run Services
You must run each service in a **separate terminal window**.

**Terminal 1 (User Service):**
```bash
python services/user_svc.py
```

**Terminal 2 (Station Service):**
```bash
python services/station_svc.py
```

**Terminal 3 (Driver Service):**
```bash
python services/driver_svc.py
```

**Terminal 4 (Rider Service):**
```bash
python services/rider_svc.py
```

**Terminal 5 (Trip Service):**
```bash
python services/trip_svc.py
```

**Terminal 6 (Notification Service):**
```bash
python services/notification_svc.py
```

**Terminal 7 (Matching Service):**
*Requires addresses of other services.*
```bash
DRIVER_ADDR=localhost:50053 RIDER_ADDR=localhost:50054 TRIP_ADDR=localhost:50055 NOTIFY_ADDR=localhost:50056 python services/matching_svc.py
```

**Terminal 8 (Location Service):**
```bash
MATCH_ADDR=localhost:50057 STATION_ADDR=localhost:50052 DRIVER_ADDR=localhost:50053 python services/location_svc.py
```

## ⚡ Key Features & Demos (Kubernetes Only)

### Horizontal Pod Autoscaling (HPA)
The system is configured to auto-scale the **Matching Service** based on CPU load.

1.  **Watch HPA**: `kubectl get hpa -w`
2.  **Port-forward Matching Service**: `kubectl port-forward svc/matching-svc 50057:50057`
3.  **Generate Load**:
    ```bash
    python3 scripts/load_gen.py
    ```
4.  **Observe**: Watch the replica count increase as load spikes.

### Fault Tolerance
The system is designed to self-heal.

1.  **Kill a Pod**: `kubectl delete pod -l app=matching-svc`
2.  **Observe**: Kubernetes automatically restarts the pod. The system remains available, and client retries handle any transient failures.

## 📂 Project Structure

```
├── api/                # Protobuf definitions
├── common/             # Shared utilities and helpers
├── frontend/           # React application
├── k8s/                # Kubernetes manifests
├── scripts/            # Build, init, and test scripts
├── services/           # Python gRPC microservices source code
├── Dockerfile.*        # Dockerfiles for each service
└── README.md           # This file
```
