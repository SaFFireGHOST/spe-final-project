# Jenkins Setup Guide

This guide explains what credentials you need to configure in Jenkins for the CI/CD pipeline to work.

## Required Jenkins Credentials

You need to set up **2 credentials** in Jenkins:

### 1. Docker Hub Credentials (for pushing images)

**Type:** Username with password  
**ID:** `dockerhub-creds`  
**Username:** Your Docker Hub username  
**Password:** Your Docker Hub password or access token

**Steps:**
1. Go to Jenkins → **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
2. Click **Add Credentials**
3. Select **Username with password**
4. Enter:
   - **ID:** `dockerhub-creds` (must match exactly)
   - **Username:** Your Docker Hub username
   - **Password:** Your Docker Hub password/token
   - **Description:** Docker Hub credentials
5. Click **Create**

---

### 2. Kubernetes Config (for deploying to cluster)

**Type:** Secret file  
**ID:** `kubeconfig`  
**File:** Your `~/.kube/config` file

**Steps:**
1. Go to Jenkins → **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
2. Click **Add Credentials**
3. Select **Secret file**
4. Click **Choose File** and upload your `~/.kube/config` file
   - Location: `/home/<your-username>/.kube/config`
   - This file contains your Minikube cluster credentials
5. Enter:
   - **ID:** `kubeconfig` (must match exactly)
   - **Description:** Kubernetes config for Minikube
6. Click **Create**

---

## Important Notes for Team Setup

Since you have **2 people** working on this:

### Option A: Both use the same Minikube cluster
- One person runs Minikube on their machine
- Share the kubeconfig file with the other person
- Both upload the same kubeconfig to their Jenkins instances
- **Pros:** Single source of truth, easier to debug
- **Cons:** Cluster goes down when that person's machine is off

### Option B: Each person has their own Minikube
- Each person runs Minikube locally
- Each uploads their own kubeconfig to Jenkins
- **Pros:** Independent development environments
- **Cons:** May have different states, harder to reproduce issues

**Recommendation:** Start with **Option B** for development, then move to a shared remote cluster (like a cloud VM) for staging/production.

---

## Verifying the Setup

After adding both credentials:

1. Go to **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
2. You should see:
   - `dockerhub-creds` (Username with password)
   - `kubeconfig` (Secret file)

3. Trigger a build and check the console output:
   - It should successfully authenticate to Docker Hub
   - It should successfully deploy to Kubernetes

---

## Troubleshooting

### "Credentials not found" error
- Make sure the credential IDs match exactly: `dockerhub-creds` and `kubeconfig`
- Check that credentials are in the **Global** domain, not a specific folder

### "Authentication required" error during deployment
- Your kubeconfig file might be pointing to the wrong cluster
- Run `kubectl config view` to verify the cluster URL
- Make sure Minikube is running: `minikube status`

### Docker push fails
- Verify Docker Hub credentials are correct
- Try logging in manually: `docker login`
- Check if you have permission to push to the registry
