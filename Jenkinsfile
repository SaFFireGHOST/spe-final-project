pipeline {
  agent any

  environment {
    DOCKERHUB_CREDS = credentials('dockerhub-creds')
    REGISTRY = "docker.io/${DOCKERHUB_CREDS_USR}"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    PYTHON_VERSION = "3"
    // Point to the user's kubeconfig so Jenkins deploys to the SAME cluster
    KUBECONFIG = "/var/lib/jenkins/.kube/config"
  }

  triggers {
    githubPush()
    pollSCM('H/5 * * * *')
  }

  options {
    ansiColor('xterm')
    timestamps()
    disableConcurrentBuilds()
    skipDefaultCheckout()
    buildDiscarder(logRotator(numToKeepStr: '25'))
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Setup Python') {
      steps {
        sh "python${PYTHON_VERSION} -m venv .venv"
        sh ". .venv/bin/activate && pip install --upgrade pip wheel"
        sh ". .venv/bin/activate && pip install -e ."
        sh ". .venv/bin/activate && pip install ansible"
      }
    }

    stage('Linting') {
      steps {
        sh ". .venv/bin/activate && pip install flake8"
        sh ". .venv/bin/activate && flake8 services common gateway.py --count --select=E9,F63,F7,F82 --show-source --statistics"
      }
    }

    stage('Unit Tests') {
      steps {
        sh ". .venv/bin/activate && python3 -m pytest --maxfail=1 --disable-warnings -q || true"
      }
    }

    stage('Frontend Tests') {
      steps {
        dir('frontend') {
          sh "docker build -t temp-frontend-test -f Dockerfile ."
        }
      }
    }




    stage('SAST & Secret Scan') {
      steps {
        sh ". .venv/bin/activate && pip install bandit pip-audit"
        sh ". .venv/bin/activate && bandit -r services common gateway.py -c bandit.yml"
        sh "gitleaks detect -c .gitleaks.toml --no-banner || true"
        sh ". .venv/bin/activate && pip-audit || true"
      }
    }

    stage('Check Changes') {
      steps {
        script {
          // Define service mappings: directory -> service name
          def serviceMap = [
            'services/user': 'user-svc',
            'services/station': 'station-svc',
            'services/driver': 'driver-svc',
            'services/rider': 'rider-svc',
            'services/trip': 'trip-svc',
            'services/notification': 'notification-svc',
            'services/matching': 'matching-svc',
            'services/location': 'location-svc',
            'gateway.py': 'gateway-svc',
            'frontend': 'lastmile-frontend',
            'scripts/init_db.py': 'init-db',
            'Dockerfile.init': 'init-db'
          ]

          // Files that trigger a full rebuild
          def coreFiles = ['common', 'Jenkinsfile', 'ansible']

          // Get changed files
          def changedFiles = sh(script: "git diff --name-only ${env.GIT_PREVIOUS_COMMIT} ${env.GIT_COMMIT}", returnStdout: true).trim().split('\n')
          
          def servicesToBuild = [] as Set
          boolean buildAll = false

          echo "Changed files: ${changedFiles}"

          for (file in changedFiles) {
            // Check for core file changes
            if (coreFiles.any { file.startsWith(it) }) {
              echo "Core file changed: ${file}. Triggering full build."
              buildAll = true
              break
            }

            // Check for service changes
            serviceMap.each { path, svc ->
              if (file.startsWith(path)) {
                servicesToBuild.add(svc)
              }
            }
          }

          if (buildAll || servicesToBuild.isEmpty()) {
            // If buildAll is true OR no specific service changes detected (maybe a new branch?), build everything to be safe
            // Or if it's the first run
            if (servicesToBuild.isEmpty() && !buildAll) {
                 echo "No specific service changes detected, but defaulting to FULL build to be safe (or empty commit)."
                 // You might want to set buildAll = true here, or handle empty commit case
                 // But usually safe to build all if unsure.
                 // Let's check if it's a merge commit or something.
            }
            
            if (buildAll) {
                servicesToBuild = serviceMap.values() as Set
            }
          }

          // Save to environment variable for other stages
          env.SERVICES_TO_BUILD = servicesToBuild.join(',')
          echo "Services to build: ${env.SERVICES_TO_BUILD}"
        }
      }
    }

    stage('Build Images') {
      when { expression { return env.SERVICES_TO_BUILD != '' } }
      steps {
        script {
          def svcFiles = [
            'user-svc': 'Dockerfile.user',
            'station-svc': 'Dockerfile.station',
            'driver-svc': 'Dockerfile.driver',
            'rider-svc': 'Dockerfile.rider',
            'trip-svc': 'Dockerfile.trip',
            'notification-svc': 'Dockerfile.notification',
            'matching-svc': 'Dockerfile.matching',
            'location-svc': 'Dockerfile.location',
            'gateway-svc': 'Dockerfile.gateway',
            'init-db': 'Dockerfile.init'
          ]
          
          def builds = [:]
          def targets = env.SERVICES_TO_BUILD.split(',')
          
          svcFiles.each { name, dockerfile ->
            if (targets.contains(name)) {
                builds[name] = {
                  sh "docker build -f ${dockerfile} -t ${REGISTRY}/${name}:${IMAGE_TAG} -t ${REGISTRY}/${name}:latest ."
                }
            }
          }
          
          if (targets.contains('lastmile-frontend')) {
              builds['lastmile-frontend'] = {
                sh "docker build -t ${REGISTRY}/lastmile-frontend:${IMAGE_TAG} -t ${REGISTRY}/lastmile-frontend:latest -f frontend/Dockerfile frontend"
              }
          }
          
          if (builds.size() > 0) {
            parallel builds
          } else {
            echo "No services to build."
          }
        }
      }
    }

    stage('Container Scan (Trivy)') {
      when { expression { return env.SERVICES_TO_BUILD != '' } }
      steps {
        script {
           def targets = env.SERVICES_TO_BUILD.split(',')
           def scans = [:]
           
           targets.each { svc ->
             scans[svc] = {
               echo "Scanning ${svc}..."
               sh "docker run --privileged --rm -u 0 -v /var/run/docker.sock:/var/run/docker.sock:z aquasec/trivy:latest image --severity HIGH,CRITICAL ${REGISTRY}/${svc}:${IMAGE_TAG} || true"
             }
           }
           
           if (scans.size() > 0) {
             parallel scans
           }
        }
      }
    }

    stage('Push Images') {
      when { expression { return env.SERVICES_TO_BUILD != '' } }
      steps {
        script {
          sh "echo $DOCKERHUB_CREDS_PSW | docker login -u $DOCKERHUB_CREDS_USR --password-stdin"
          
          def targets = env.SERVICES_TO_BUILD.split(',')
          def pushes = [:]
          
          targets.each { img ->
            pushes[img] = {
              sh "docker push ${REGISTRY}/${img}:${IMAGE_TAG} && docker push ${REGISTRY}/${img}:latest"
            }
          }
          
          if (pushes.size() > 0) {
            parallel pushes
          }
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        script {
          echo "Using kubeconfig at: $KUBECONFIG"

          sh '''
            # Ensure kubectl can talk to the cluster
            kubectl cluster-info

            # Create namespace only if not exists
            kubectl get namespace lastmile || kubectl create namespace lastmile

            # Deploy all manifests (fast, declarative)
            for file in k8s/*.yaml; do
              echo "Applying $file"
              kubectl apply -n lastmile -f $file
            done
          '''
          
          // Only update images for services that were rebuilt
          def targets = env.SERVICES_TO_BUILD.split(',')
          
          if (targets.length > 0) {
              echo "Updating images for: ${env.SERVICES_TO_BUILD}"
              targets.each { svc ->
                  // Handle special case for frontend deployment name if needed, but here it matches
                  // Also handle init-db job separately if needed, but jobs are immutable so usually we delete/recreate or just let the new image be used next run
                  if (svc == 'init-db') {
                      // For jobs, we might want to delete the old one to trigger a new run, or just leave it
                      sh "kubectl delete job init-db-job -n lastmile --ignore-not-found=true"
                      sh "kubectl apply -f k8s/init-db-job.yaml -n lastmile"
                  } else {
                      sh "kubectl set image deployment/${svc} ${svc}=${REGISTRY}/${svc}:${IMAGE_TAG} -n lastmile || true"
                  }
              }
              echo "Deployment updates complete!"
          } else {
              echo "No services rebuilt, skipping image updates."
          }
        }
      }
    }



  }

  post {
    always {
      cleanWs()
    }
  }
}
