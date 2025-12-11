# Deployment Flow & Issues Explained

## Current Issues Identified

### 1. **Init-DB Job ImagePullBackOff** ❌
**Problem:** The `init-db-job` is trying to pull `init-db:latest` from Docker Hub, but it doesn't exist there.

**Why:** 
- Jenkins builds the image as `saffireghost/init-db:39` and pushes it to Docker Hub
- The k8s manifest references `init-db:latest` (local image name)
- `imagePullPolicy: IfNotPresent` tries to pull from Docker Hub when image doesn't exist locally

**Solution:** The manifest needs to reference `saffireghost/init-db:latest` instead of `init-db:latest`

### 2. **ELK Stack Not Deployed** ❌
**Problem:** No ELK pods are running.

**Why:** The `elk-deploy` role uses path `../k8s/elk/` which is **relative to the role directory**, not the playbook directory.

**Current path resolution:**
- Role is at: `ansible/playbooks/roles/elk-deploy/tasks/main.yml`
- `../k8s/elk/` resolves to: `ansible/playbooks/roles/k8s/elk/` ❌ (doesn't exist!)

**Solution:** Use absolute path or correct relative path from playbook directory.

### 3. **Gateway-Secure Deployment** ✅ FIXED
Deleted successfully.

---

## Image Flow Explanation

### How It Currently Works:

```
┌─────────────────────────────────────────────────────────────┐
│                    JENKINS PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Build Images (locally on Jenkins host)                  │
│     ├─ user-svc:latest                                      │
│     ├─ gateway-svc:latest                                   │
│     ├─ init-db:latest                                       │
│     └─ ... (all services)                                   │
│                                                              │
│  2. Tag Images with Registry + Build Number                 │
│     ├─ saffireghost/user-svc:39                            │
│     ├─ saffireghost/gateway-svc:39                         │
│     ├─ saffireghost/init-db:39                             │
│     └─ ... (all services)                                   │
│                                                              │
│  3. Push to Docker Hub                                      │
│     └─ docker push saffireghost/<service>:39               │
│     └─ docker push saffireghost/<service>:latest           │
│                                                              │
│  4. Ansible Updates Deployment Images                       │
│     └─ kubectl set image deployment/<svc>                   │
│         <svc>=saffireghost/<svc>:39                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    KUBERNETES (Minikube)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  imagePullPolicy: IfNotPresent                              │
│                                                              │
│  ┌─────────────────────────────────────────┐               │
│  │  1. Check if image exists locally       │               │
│  │     (in Minikube's Docker daemon)       │               │
│  └─────────────────────────────────────────┘               │
│                    │                                         │
│         ┌──────────┴──────────┐                            │
│         │                     │                             │
│    YES (exists)          NO (doesn't exist)                 │
│         │                     │                             │
│    Use local image      Pull from Docker Hub               │
│         │                     │                             │
│         ▼                     ▼                             │
│    ✅ Works!           ❌ Fails if not in registry!        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### The Problem:

**For services (user-svc, gateway-svc, etc.):** ✅ Works
- Jenkins pushes `saffireghost/user-svc:39` to Docker Hub
- Ansible updates deployment: `kubectl set image deployment/user-svc user-svc=saffireghost/user-svc:39`
- Kubernetes pulls from Docker Hub (because Minikube doesn't have the image locally)

**For init-db job:** ❌ Fails
- Jenkins pushes `saffireghost/init-db:39` to Docker Hub
- But the manifest still references `init-db:latest` (not the registry image!)
- Kubernetes tries to pull `init-db:latest` from Docker Hub → **doesn't exist!**

**For ELK stack:** ❌ Not deployed
- The role path is wrong, so `kubectl apply` never runs

---

## Solutions

### Fix 1: Update init-db-job.yaml

Change the image reference to use the registry:

```yaml
# Current (WRONG)
image: init-db:latest

# Fixed (CORRECT)
image: saffireghost/init-db:latest
```

### Fix 2: Fix ELK Deploy Role Path

The role needs to use the correct path. Options:

**Option A:** Use playbook_dir variable
```yaml
command: kubectl apply -f {{ playbook_dir }}/../k8s/elk/
```

**Option B:** Use absolute path from project root
```yaml
command: kubectl apply -f ../../k8s/elk/
```

### Fix 3: Alternative - Load Images into Minikube

If you want to use local images without pulling from registry:

```bash
# Point Docker CLI to Minikube's Docker daemon
eval $(minikube docker-env)

# Build images (they'll be built inside Minikube)
docker build -f Dockerfile.user -t user-svc:latest .
docker build -f Dockerfile.init -t init-db:latest .
# ... etc

# Now Kubernetes can use local images with imagePullPolicy: IfNotPresent
```

But this defeats the purpose of your CI/CD pipeline!

---

## Recommended Approach

**Keep the current flow (push to registry)** but fix the manifests:

1. ✅ All service deployments already use `saffireghost/<service>:latest`
2. ❌ Fix `init-db-job.yaml` to use `saffireghost/init-db:latest`
3. ❌ Fix ELK deploy role path
4. ✅ Continue using `imagePullPolicy: IfNotPresent` (efficient - only pulls if not cached)

---

## Why This Approach is Better

### Advantages:
- ✅ **Consistent:** All images come from the same source (Docker Hub)
- ✅ **Portable:** Works on any Kubernetes cluster, not just Minikube
- ✅ **Versioned:** Each build has a unique tag (build number)
- ✅ **Cacheable:** `IfNotPresent` means images are only pulled once per version
- ✅ **CI/CD Ready:** Jenkins pipeline handles everything automatically

### What Happens:
1. Jenkins builds and pushes images to Docker Hub
2. Ansible updates deployments with new image tags
3. Kubernetes pulls images from Docker Hub (first time only)
4. Subsequent restarts use cached images (fast!)

---

## Summary

**Current State:**
- ✅ All service deployments work (using registry images)
- ❌ init-db job fails (using local image name)
- ❌ ELK stack not deployed (wrong path in role)
- ✅ gateway-secure deleted

**Action Items:**
1. Fix `k8s/init-db-job.yaml` to use `saffireghost/init-db:latest`
2. Fix `ansible/playbooks/roles/elk-deploy/tasks/main.yml` path
3. Re-run pipeline or manually apply fixes
