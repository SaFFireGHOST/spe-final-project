# Pipeline Run Guide

Complete step-by-step guide to run the LastMile application deployment pipeline.

---

## Prerequisites

### Required Software
- **Docker** (with Docker Compose)
- **Minikube** (for local Kubernetes cluster)
- **kubectl** (Kubernetes CLI)
- **Ansible** (for deployment automation)
- **Jenkins** (for CI/CD)
- **Git** (for version control)

---

## Part 1: Local Setup (Without Jenkins)

### Step 1: Start Minikube
```bash
# Start Minikube cluster
minikube start --driver=docker --cpus=4 --memory=8192

# Verify cluster is running
kubectl cluster-info
kubectl get nodes
```

### Step 2: Configure kubectl Context
```bash
# Ensure kubectl is pointing to Minikube
kubectl config current-context
# Should output: minikube

# If not, set context
kubectl config use-context minikube
```

### Step 3: Build Docker Images
```bash
# Build all service images
./build_images.sh

# Load images into Minikube (required for local development)
./load_images_minikube.sh
```

### Step 4: Run Ansible Deployment
```bash
# Deploy using Ansible
ansible-playbook -i ansible/inventory ansible/deploy.yml \
  --extra-vars "registry=docker.io/saffireghost image_tag=latest mongo_uri=mongodb://mongo:27017 manage_minikube=false deploy_services=user-svc,station-svc,driver-svc,rider-svc,trip-svc,notification-svc,matching-svc,location-svc,gateway-svc,lastmile-frontend,init-db" \
  --vault-password-file ansible/vault_pass.txt
```

**Note:** The `deploy_services` variable should list all services you want to deploy. For initial deployment, include all services.

### Step 5: Verify Deployment
```bash
# Check all pods are running
kubectl get pods -n lastmile

# Check services
kubectl get svc -n lastmile

# Check ELK stack
kubectl get pods -n lastmile | grep -E 'elasticsearch|kibana|logstash|filebeat'
```

### Step 6: Access the Application
```bash
# Get Minikube IP
minikube ip

# Access frontend (NodePort)
# Open browser: http://<minikube-ip>:30081

# Or use port-forward for gateway
kubectl port-forward svc/gateway 5000:5000 -n lastmile
# Open browser: http://localhost:5000

# Access Kibana (ELK)
kubectl port-forward svc/kibana 5601:5601 -n lastmile
# Open browser: http://localhost:5601
# Login: elastic / password123
```

---

## Part 2: Jenkins CI/CD Pipeline Setup

### Step 1: Install Jenkins
```bash
# If not already installed, install Jenkins
# Follow official Jenkins installation guide for your OS
# https://www.jenkins.io/doc/book/installing/
```

### Step 2: Configure Jenkins Credentials

#### A. Docker Hub Credentials
1. Go to Jenkins → Manage Jenkins → Credentials
2. Click on "System" → "Global credentials (unrestricted)"
3. Click "Add Credentials"
4. Fill in:
   - **Kind**: Username with password
   - **Scope**: Global
   - **Username**: Your Docker Hub username
   - **Password**: Your Docker Hub password or access token
   - **ID**: `dockerhub-creds` (must match Jenkinsfile)
   - **Description**: Docker Hub Credentials
5. Click "Create"

#### B. Kubeconfig File (Optional - for remote clusters)
If deploying to a remote cluster (not Minikube on Jenkins host):
1. Click "Add Credentials"
2. Fill in:
   - **Kind**: Secret file
   - **Scope**: Global
   - **File**: Upload your `~/.kube/config` file
   - **ID**: `kubeconfig`
   - **Description**: Kubernetes Config
3. Click "Create"

**Note:** For Minikube on the same host as Jenkins, the Jenkinsfile uses `/var/lib/jenkins/.kube/config` directly, so this credential is not needed.

### Step 3: Configure Jenkins Agent

#### A. Install Required Tools on Jenkins Agent
```bash
# Install Docker (if not already installed)
sudo apt-get update
sudo apt-get install -y docker.io

# Add jenkins user to docker group
sudo usermod -aG docker jenkins

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Install Ansible
sudo apt-get install -y ansible

# Install Python and pip
sudo apt-get install -y python3 python3-pip python3-venv

# Install Trivy (for container scanning)
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install -y trivy

# Install Gitleaks (for secret scanning)
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz
tar -xzf gitleaks_8.18.0_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/
```

#### B. Setup Minikube for Jenkins User
```bash
# Switch to jenkins user
sudo su - jenkins

# Start Minikube
minikube start --driver=docker --cpus=4 --memory=8192

# Verify
kubectl cluster-info

# Exit jenkins user
exit
```

### Step 4: Create Jenkins Pipeline Job

1. Go to Jenkins Dashboard
2. Click "New Item"
3. Enter name: `lastmile-deployment`
4. Select "Pipeline"
5. Click "OK"

#### Configure Pipeline:
1. **General Section:**
   - ✓ Check "GitHub project"
   - Project URL: `https://github.com/SaFFireGHOST/spe-final-project/`

2. **Build Triggers:**
   - ✓ Check "GitHub hook trigger for GITScm polling"
   - ✓ Check "Poll SCM" (optional fallback)
     - Schedule: `H/5 * * * *`

3. **Pipeline Section:**
   - Definition: "Pipeline script from SCM"
   - SCM: Git
   - Repository URL: `https://github.com/SaFFireGHOST/spe-final-project.git`
   - Branch: `*/main` (or your default branch)
   - Script Path: `Jenkinsfile`

4. Click "Save"

### Step 5: Configure GitHub Webhook (Optional)

1. Go to your GitHub repository
2. Settings → Webhooks → Add webhook
3. Fill in:
   - **Payload URL**: `http://<jenkins-url>/github-webhook/`
   - **Content type**: `application/json`
   - **Events**: "Just the push event"
4. Click "Add webhook"

### Step 6: Prepare Ansible Vault

The Ansible vault password is stored in `ansible/vault_pass.txt`. Ensure this file exists on the Jenkins agent:

```bash
# On Jenkins agent, ensure the file exists
cat ansible/vault_pass.txt
# Should output: password
```

If you need to view or edit vault secrets:
```bash
# View encrypted secrets
ansible-vault view ansible/secrets.yml --vault-password-file ansible/vault_pass.txt

# Edit encrypted secrets
ansible-vault edit ansible/secrets.yml --vault-password-file ansible/vault_pass.txt
```

---

## Part 3: Running the Pipeline

### Option A: Manual Trigger
1. Go to Jenkins → lastmile-deployment
2. Click "Build Now"
3. Monitor the build progress in "Console Output"

### Option B: Git Push Trigger
```bash
# Make a code change
git add .
git commit -m "Your commit message"
git push origin main

# Jenkins will automatically trigger the pipeline
```

### Pipeline Stages Explained

1. **Checkout**: Clones the repository
2. **Setup Python**: Creates virtual environment and installs dependencies
3. **Linting**: Runs flake8 on Python code
4. **Unit Tests**: Runs pytest
5. **Frontend Tests**: Builds frontend Docker image
6. **SAST & Secret Scan**: Runs Bandit, Gitleaks, and pip-audit
7. **Check Changes**: Detects which services changed via git diff
8. **Build Images**: Builds Docker images for changed services only
9. **Container Scan (Trivy)**: Scans images for vulnerabilities
10. **Push Images**: Pushes images to Docker Hub
11. **Deploy to Kubernetes**: Runs Ansible playbook to deploy

---

## Part 4: Selective Deployment

The pipeline is smart and only rebuilds/redeploys services that changed:

### Example Scenarios:

**Scenario 1: Change only user service**
```bash
# Edit services/user/user_svc.py
git add services/user/user_svc.py
git commit -m "Update user service"
git push
```
→ Only `user-svc` image is built and deployed

**Scenario 2: Change frontend**
```bash
# Edit frontend/src/App.tsx
git add frontend/src/App.tsx
git commit -m "Update frontend"
git push
```
→ Only `lastmile-frontend` image is built and deployed

**Scenario 3: Change shared code**
```bash
# Edit common/models.py
git add common/models.py
git commit -m "Update shared models"
git push
```
→ **ALL backend services** are rebuilt and deployed

**Scenario 4: Change Ansible**
```bash
# Edit ansible/deploy.yml
git add ansible/deploy.yml
git commit -m "Update deployment"
git push
```
→ **ALL services** are rebuilt and deployed

---

## Part 5: Troubleshooting

### Jenkins Build Fails

**Check Docker permissions:**
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

**Check kubectl access:**
```bash
sudo su - jenkins
kubectl cluster-info
kubectl get nodes
```

**Check Ansible vault:**
```bash
# Ensure vault password file exists
ls -la ansible/vault_pass.txt
```

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n lastmile

# Describe problematic pod
kubectl describe pod <pod-name> -n lastmile

# Check logs
kubectl logs <pod-name> -n lastmile

# Check events
kubectl get events -n lastmile --sort-by='.lastTimestamp'
```

### Image Pull Errors

```bash
# If using Minikube, ensure images are loaded
./load_images_minikube.sh

# Or configure imagePullPolicy in manifests
# imagePullPolicy: IfNotPresent
```

### ELK Stack Issues

```bash
# Check ELK pods
kubectl get pods -n lastmile | grep -E 'elasticsearch|kibana|logstash|filebeat'

# Check Elasticsearch logs
kubectl logs -l app=elasticsearch -n lastmile

# Restart ELK stack if needed
kubectl delete pod -l app=elasticsearch -n lastmile
kubectl delete pod -l app=kibana -n lastmile
```

---

## Part 6: Clean Up

### Stop Everything
```bash
# Delete all resources in lastmile namespace
kubectl delete namespace lastmile

# Stop Minikube
minikube stop

# Delete Minikube cluster (optional)
minikube delete
```

### Reset Jenkins Job
1. Go to Jenkins → lastmile-deployment
2. Click "Configure"
3. Scroll to bottom → "Delete Pipeline"

---

## Quick Reference Commands

```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes

# Check application pods
kubectl get pods -n lastmile

# Check services
kubectl get svc -n lastmile

# Port forward gateway
kubectl port-forward svc/gateway 5000:5000 -n lastmile

# Port forward frontend
kubectl port-forward svc/frontend 3000:3000 -n lastmile

# Port forward Kibana
kubectl port-forward svc/kibana 5601:5601 -n lastmile

# View logs
kubectl logs -f <pod-name> -n lastmile

# Restart deployment
kubectl rollout restart deployment/<deployment-name> -n lastmile

# Scale deployment
kubectl scale deployment/<deployment-name> --replicas=3 -n lastmile

# Run Ansible manually
ansible-playbook -i ansible/inventory ansible/deploy.yml \
  --extra-vars "registry=docker.io/saffireghost image_tag=latest mongo_uri=mongodb://mongo:27017 manage_minikube=false deploy_services=user-svc,gateway-svc" \
  --vault-password-file ansible/vault_pass.txt
```

---

## Summary

1. **Local Development**: Use Minikube + Ansible for manual deployments
2. **CI/CD**: Use Jenkins pipeline for automated deployments on git push
3. **Selective Deployment**: Only changed services are rebuilt and deployed
4. **Observability**: ELK stack is automatically deployed for log monitoring
5. **Modular**: Ansible roles make deployment maintainable and reusable
