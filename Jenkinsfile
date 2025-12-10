pipeline {
  agent any

  environment {
    DOCKERHUB_CREDS = credentials('dockerhub-creds')
    REGISTRY = "docker.io/${DOCKERHUB_CREDS_USR}"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    PYTHON_VERSION = "3"
    // Point to the user's kubeconfig so Jenkins deploys to the SAME cluster
    KUBECONFIG = "/home/harsh2835/.kube/config"
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

    stage('Global Tests') {
      parallel {
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
              sh "npm install"
              sh "npm test -- --run"
            }
          }
        }
        stage('SAST') {
          steps {
            sh ". .venv/bin/activate && pip install bandit pip-audit"
            sh ". .venv/bin/activate && bandit -r services common gateway.py -c bandit.yml"
            sh "gitleaks detect -c .gitleaks.toml --no-banner || true"
            sh ". .venv/bin/activate && pip-audit || true"
          }
        }
      }
    }

    stage('Determine Changed Services') {
      steps {
        script {
          // Get list of changed files in this commit
          def changedFiles = sh(script: "git diff --name-only HEAD~1 HEAD", returnStdout: true).trim().split('\n')
          
          // Map folders to service names
          def serviceMap = [
            'services/user-svc': 'user-svc',
            'services/station-svc': 'station-svc',
            'services/driver-svc': 'driver-svc',
            'services/rider-svc': 'rider-svc',
            'services/trip-svc': 'trip-svc',
            'services/notification-svc': 'notification-svc',
            'services/matching-svc': 'matching-svc',
            'services/location-svc': 'location-svc',
            'gateway.py': 'gateway-svc',
            'frontend': 'lastmile-frontend'
          ]

          def servicesToBuild = []
          
          // Check which services have changes
          serviceMap.each { path, svcName ->
            if (changedFiles.any { it.startsWith(path) }) {
              servicesToBuild.add(svcName)
            }
          }
          
          // Always build if it's the first build or forced
          if (servicesToBuild.isEmpty()) {
            echo "No service changes detected. Building ALL for safety."
            servicesToBuild = serviceMap.values() as List
          } else {
            echo "Detected changes in: ${servicesToBuild}"
          }
          
          env.CHANGED_SERVICES = servicesToBuild.join(',')
        }
      }
    }

    stage('Parallel Service Pipelines') {
      steps {
        script {
          def services = [
            'user-svc': 'Dockerfile.user',
            'station-svc': 'Dockerfile.station',
            'driver-svc': 'Dockerfile.driver',
            'rider-svc': 'Dockerfile.rider',
            'trip-svc': 'Dockerfile.trip',
            'notification-svc': 'Dockerfile.notification',
            'matching-svc': 'Dockerfile.matching',
            'location-svc': 'Dockerfile.location',
            'gateway-svc': 'Dockerfile.gateway'
          ]
          
          def parallelStages = [:]

          services.each { name, dockerfile ->
            if (env.CHANGED_SERVICES.contains(name)) {
              parallelStages[name] = {
                stage("Pipeline: ${name}") {
                  node {
                    // 1. Build
                    stage("Build ${name}") {
                      sh "docker build -f ${dockerfile} -t ${REGISTRY}/${name}:${IMAGE_TAG} -t ${REGISTRY}/${name}:latest ."
                    }
                    // 2. Scan (Fixed Trivy)
                    stage("Scan ${name}") {
                      sh "docker run --rm -u 0 -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity HIGH,CRITICAL ${REGISTRY}/${name}:${IMAGE_TAG} || true"
                    }
                    // 3. Push
                    stage("Push ${name}") {
                      withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                         sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                         sh "docker push ${REGISTRY}/${name}:${IMAGE_TAG} && docker push ${REGISTRY}/${name}:latest"
                      }
                    }
                    // 4. Deploy (Update Image)
                    stage("Deploy ${name}") {
                         sh ". .venv/bin/activate && kubectl set image deployment/${name} ${name}=${REGISTRY}/${name}:${IMAGE_TAG} -n lastmile"
                    }
                  }
                }
              }
            }
          }

          // Handle Frontend Separately (different structure)
          if (env.CHANGED_SERVICES.contains('lastmile-frontend')) {
            parallelStages['frontend'] = {
              stage("Pipeline: Frontend") {
                node {
                    stage("Build Frontend") {
                        sh "docker build -t ${REGISTRY}/lastmile-frontend:${IMAGE_TAG} -t ${REGISTRY}/lastmile-frontend:latest -f frontend/Dockerfile frontend"
                    }
                    stage("Scan Frontend") {
                        sh "docker run --rm -u 0 -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity HIGH,CRITICAL ${REGISTRY}/lastmile-frontend:${IMAGE_TAG} || true"
                    }
                    stage("Push Frontend") {
                        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                            sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                            sh "docker push ${REGISTRY}/lastmile-frontend:${IMAGE_TAG} && docker push ${REGISTRY}/lastmile-frontend:latest"
                        }
                    }
                    stage("Deploy Frontend") {
                        sh ". .venv/bin/activate && kubectl set image deployment/frontend frontend=${REGISTRY}/lastmile-frontend:${IMAGE_TAG} -n lastmile"
                    }
                }
              }
            }
          }

          if (parallelStages.size() > 0) {
            parallel parallelStages
          } else {
            echo "No services to build/deploy."
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
