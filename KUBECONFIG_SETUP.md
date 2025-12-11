# Kubeconfig Setup for Jenkins

This guide explains how to configure Jenkins to access your Minikube Kubernetes cluster by copying the kubeconfig and certificates to Jenkins home directory.

---

## Overview

When Jenkins runs `kubectl` commands, it needs:
1. A valid kubeconfig file pointing to the cluster
2. Access to the certificate files referenced in that kubeconfig
3. Proper file permissions to read these files

This guide shows how to copy your working Minikube setup to Jenkins so it can deploy to the same cluster.

---

## Prerequisites

- Minikube is running on the same host as Jenkins
- You can successfully run `kubectl get nodes` from your user account
- Jenkins is installed and running

---

## Setup Steps

### Step 1: Copy Kubeconfig to Jenkins Home

```bash
# Create .kube directory for jenkins user
sudo mkdir -p /var/lib/jenkins/.kube

# Copy your working kubeconfig
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config

# Set ownership to jenkins user
sudo chown jenkins:jenkins /var/lib/jenkins/.kube/config
sudo chmod 600 /var/lib/jenkins/.kube/config
```

### Step 2: Copy Entire .minikube Directory

Minikube stores certificates, profiles, and cached data under `~/.minikube`. We need to copy this entire directory to Jenkins home.

```bash
# Remove any existing partial copy (optional, safe to run)
sudo rm -rf /var/lib/jenkins/.minikube

# Copy the entire .minikube directory
sudo cp -r ~/.minikube /var/lib/jenkins/.minikube

# Fix ownership so jenkins user can read files
sudo chown -R jenkins:jenkins /var/lib/jenkins/.minikube

# Set proper permissions
# Directories: 750 (rwxr-x---)
sudo find /var/lib/jenkins/.minikube -type d -exec chmod 750 {} \;

# Files: 640 (rw-r-----)
sudo find /var/lib/jenkins/.minikube -type f -exec chmod 640 {} \;
```

**Why copy everything?**  
Minikube stores certificates, profiles, and cached images under `.minikube`. The kubeconfig references these files by absolute path. Copying the full tree prevents "file not found" errors.

### Step 3: Update Certificate Paths in Jenkins Kubeconfig

The kubeconfig file contains absolute paths to certificate files. We need to update these paths to point to the Jenkins home directory.

```bash
# Edit the Jenkins kubeconfig
sudo nano /var/lib/jenkins/.kube/config
```

**Find and replace certificate paths:**

Look for these fields in the kubeconfig:
- `certificate-authority:`
- `client-certificate:`
- `client-key:`

**Change from:**
```yaml
certificate-authority: /home/<your-username>/.minikube/ca.crt
client-certificate: /home/<your-username>/.minikube/profiles/minikube/client.crt
client-key: /home/<your-username>/.minikube/profiles/minikube/client.key
```

**Change to:**
```yaml
certificate-authority: /var/lib/jenkins/.minikube/ca.crt
client-certificate: /var/lib/jenkins/.minikube/profiles/minikube/client.crt
client-key: /var/lib/jenkins/.minikube/profiles/minikube/client.key
```

**Note:** If your kubeconfig uses embedded certificates (`certificate-authority-data`, `client-certificate-data`, `client-key-data`), you don't need to modify paths. The certificates are base64-encoded directly in the config file.

**Example of embedded certificates (no path changes needed):**
```yaml
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTi...
    server: https://192.168.49.2:8443
  name: minikube
users:
- name: minikube
  user:
    client-certificate-data: LS0tLS1CRUdJTi...
    client-key-data: LS0tLS1CRUdJTi...
```

### Step 4: Set Current Context

Ensure the kubeconfig has the correct context set.

```bash
# Edit the kubeconfig
sudo nano /var/lib/jenkins/.kube/config
```

Find the `current-context:` field and ensure it's set to `minikube`:

```yaml
current-context: minikube
```

If it's empty or missing, add this line at the top level of the YAML file.

### Step 5: Verify Access from Jenkins User

Test that the jenkins user can access the cluster:

```bash
# View the kubeconfig (verify paths are correct)
sudo su - jenkins -c "kubectl config view --minify"

# Get cluster nodes (should show minikube node)
sudo su - jenkins -c "kubectl get nodes"

# Show cluster info
sudo su - jenkins -c "kubectl cluster-info"
```

**Expected output for `kubectl get nodes`:**
```
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   1d    v1.28.3
```

**Expected output for `kubectl cluster-info`:**
```
Kubernetes control plane is running at https://192.168.49.2:8443
CoreDNS is running at https://192.168.49.2:8443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
```

---

## Troubleshooting

### Error: "Unable to connect to the server"

**Cause:** Minikube might not be running, or the server URL is incorrect.

**Solution:**
```bash
# Check if Minikube is running
minikube status

# If not running, start it
minikube start

# Verify the cluster IP matches kubeconfig
kubectl cluster-info
```

### Error: "x509: certificate signed by unknown authority"

**Cause:** Certificate files are missing or paths are incorrect.

**Solution:**
```bash
# Verify certificate files exist
sudo ls -la /var/lib/jenkins/.minikube/ca.crt
sudo ls -la /var/lib/jenkins/.minikube/profiles/minikube/client.crt
sudo ls -la /var/lib/jenkins/.minikube/profiles/minikube/client.key

# If files are missing, re-copy the .minikube directory
sudo cp -r ~/.minikube /var/lib/jenkins/.minikube
sudo chown -R jenkins:jenkins /var/lib/jenkins/.minikube
```

### Error: "permission denied"

**Cause:** Jenkins user doesn't have permission to read certificate files.

**Solution:**
```bash
# Fix ownership
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo chown -R jenkins:jenkins /var/lib/jenkins/.minikube

# Fix permissions
sudo chmod 600 /var/lib/jenkins/.kube/config
sudo find /var/lib/jenkins/.minikube -type f -exec chmod 640 {} \;
```

### Error: "The connection to the server localhost:8080 was refused"

**Cause:** The kubeconfig is not being read, or `KUBECONFIG` environment variable is not set.

**Solution:**
```bash
# Verify kubeconfig exists
sudo ls -la /var/lib/jenkins/.kube/config

# Test with explicit KUBECONFIG path
sudo su - jenkins -c "KUBECONFIG=/var/lib/jenkins/.kube/config kubectl get nodes"

# If that works, the Jenkinsfile should set KUBECONFIG environment variable
# (Already done in your Jenkinsfile: KUBECONFIG = "/var/lib/jenkins/.kube/config")
```

---

## Alternative: Using Minikube Docker Env

If you're running Jenkins in Docker and want to use Minikube's Docker daemon:

```bash
# Get Minikube Docker environment variables
minikube docker-env

# Apply them to your shell
eval $(minikube docker-env)

# Now docker commands will use Minikube's Docker daemon
docker ps
```

This is useful for building images directly in Minikube without pushing to a registry.

---

## Security Considerations

### File Permissions
- Kubeconfig: `600` (rw-------)
- Certificate files: `640` (rw-r-----)
- Directories: `750` (rwxr-x---)

### Owner
All files should be owned by `jenkins:jenkins` to ensure the Jenkins process can read them.

### Secrets
- Never commit kubeconfig files to Git
- Use Ansible Vault or Jenkins credentials for sensitive data
- Rotate certificates periodically

---

## Verification Checklist

Before running your Jenkins pipeline, verify:

- [ ] `/var/lib/jenkins/.kube/config` exists and is owned by jenkins:jenkins
- [ ] `/var/lib/jenkins/.minikube/` directory exists with all certificates
- [ ] Certificate paths in kubeconfig point to `/var/lib/jenkins/.minikube/`
- [ ] `current-context` is set to `minikube`
- [ ] `sudo su - jenkins -c "kubectl get nodes"` returns minikube node
- [ ] Jenkins can access the cluster: `sudo su - jenkins -c "kubectl cluster-info"`

---

## Quick Reference

```bash
# Copy kubeconfig
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown jenkins:jenkins /var/lib/jenkins/.kube/config

# Copy Minikube certs
sudo cp -r ~/.minikube /var/lib/jenkins/.minikube
sudo chown -R jenkins:jenkins /var/lib/jenkins/.minikube

# Update paths in kubeconfig
sudo nano /var/lib/jenkins/.kube/config
# Change: /home/<user>/.minikube → /var/lib/jenkins/.minikube

# Verify
sudo su - jenkins -c "kubectl get nodes"
```

---

## Additional Resources

- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kubernetes Authentication](https://kubernetes.io/docs/reference/access-authn-authz/authentication/)
- [Jenkins Kubernetes Plugin](https://plugins.jenkins.io/kubernetes/)
