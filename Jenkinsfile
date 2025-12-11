pipeline {
  agent any

  environment {
    DOCKERHUB_CREDS = credentials('dockerhub-creds')
    REGISTRY = "docker.io/${DOCKERHUB_CREDS_USR}"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    PYTHON_VERSION = "3"
    // Point to the user's kubeconfig so Jenkins deploys to the SAME cluster
    // comment check 
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
          // Run tests directly in a node container (like a virtual env) without building a custom image
          // Using Node 20 (LTS) to avoid npm errors present in Node 22
          sh "docker run --rm -v \$(pwd):/app -w /app node:20-alpine sh -c 'npm install && npm run test -- run'"
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
          def changedServices = getChangedServices()
          env.SERVICES_TO_BUILD = changedServices.join(',')
          echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          echo "🔍 SERVICES TO BUILD:"
          echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          if (changedServices.size() > 0) {
            changedServices.each { svc ->
              echo "  ✓ ${svc}"
            }
          } else {
            echo "  ⚠ No services to build (no changes detected)"
          }
          echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          echo "Services list: ${env.SERVICES_TO_BUILD}"
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

    // stage('Container Scan (Trivy)') {
    //   when { expression { return env.SERVICES_TO_BUILD != '' } }
    //   steps {
    //     script {
    //        def targets = env.SERVICES_TO_BUILD.split(',')
    //        def scans = [:]
           
    //        targets.each { svc ->
    //          scans[svc] = {
    //             echo "Scanning ${svc}..."
    //             sh "docker run --privileged --rm -u 0 -v /var/run/docker.sock:/var/run/docker.sock:z aquasec/trivy:latest image --timeout 15m --scanners vuln --severity HIGH,CRITICAL ${REGISTRY}/${svc}:${IMAGE_TAG} || true"
    //           }
    //        }
    //                   if (scans.size() > 0) {
    //          parallel scans
    //         }
    //     }
    //   }
    // }

    stage('Push Images') {
      when { expression { return env.SERVICES_TO_BUILD != '' } }
      steps {
        script {
          sh 'echo $DOCKERHUB_CREDS_PSW | docker login -u $DOCKERHUB_CREDS_USR --password-stdin'
          
          def targets = env.SERVICES_TO_BUILD.split(',')
          def pushes = [:]
          
          targets.each { img ->
            pushes[img] = {
              sh "docker push ${REGISTRY}/${img}:${IMAGE_TAG} && docker push ${REGISTRY}/${img}:latest"
            }
          }
          
          if (pushes.size() > 0) {
            // Run pushes sequentially
            pushes.each { name, pushStep ->
                pushStep()
            }
          }
        }
      }
    }

    stage('Deploy to Kubernetes'){
      steps{
        sh ". .venv/bin/activate && ansible-playbook -i ansible/inventory ansible/deploy.yml --extra-vars \"image_tag=${IMAGE_TAG} registry=${REGISTRY} mongo_uri=mongodb://mongo:27017 manage_minikube=false deploy_services=${SERVICES_TO_BUILD}\" --vault-password-file ansible/vault_pass.txt"
      }
    }


  }

  post {
    always {
      cleanWs()
    }
  }
}

// Helper function to detect changed services
def getChangedServices() {
    def allServices = ['user-svc', 'station-svc', 'driver-svc', 'rider-svc', 'trip-svc', 'notification-svc', 'matching-svc', 'location-svc', 'gateway-svc', 'lastmile-frontend', 'init-db']
    
    // Debugging: Print commit info
    echo "Current Commit: ${env.GIT_COMMIT}"
    echo "Previous Commit (Env): ${env.GIT_PREVIOUS_COMMIT}"

    def previousCommit = env.GIT_PREVIOUS_COMMIT
    
    // Fallback: If env var is missing, try to get the previous commit from git history
    if (previousCommit == null || previousCommit == '') {
        try {
            // Check if we have enough depth
            previousCommit = sh(script: "git rev-parse HEAD^", returnStdout: true).trim()
            echo "Previous Commit (Git fallback): ${previousCommit}"
        } catch (Exception e) {
            echo "Could not determine previous commit via git: ${e.message}"
        }
    }

    // If still null, build all
    if (previousCommit == null || previousCommit == '') {
        echo "No previous commit found. Building all services."
        return allServices
    }

    def currentCommit = env.GIT_COMMIT
    if (currentCommit == null || currentCommit == '') {
        try {
            currentCommit = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
            echo "Current Commit (Git fallback): ${currentCommit}"
        } catch (Exception e) {
            echo "Could not determine current commit: ${e.message}"
            return allServices
        }
    }

    try {
        def changedFiles = sh(script: "git diff --name-only ${previousCommit} ${currentCommit}", returnStdout: true).trim().split('\n')
        echo "Changed files: ${changedFiles}"
        
        def changedServices = [] as Set

        for (file in changedFiles) {
            if (file.startsWith('common/') || file == 'pyproject.toml' || file == 'Jenkinsfile' || file.startsWith('ansible/')) {
                echo "Shared code changed (${file}). Building all backend services."
                return allServices
            }
            
            if (file.startsWith('frontend/')) {
                changedServices.add('lastmile-frontend')
            } else if (file.startsWith('services/user') || file == 'Dockerfile.user') {
                changedServices.add('user-svc')
            } else if (file.startsWith('services/station') || file == 'Dockerfile.station') {
                changedServices.add('station-svc')
            } else if (file.startsWith('services/driver') || file == 'Dockerfile.driver') {
                changedServices.add('driver-svc')
            } else if (file.startsWith('services/rider') || file == 'Dockerfile.rider') {
                changedServices.add('rider-svc')
            } else if (file.startsWith('services/trip') || file == 'Dockerfile.trip') {
                changedServices.add('trip-svc')
            } else if (file.startsWith('services/notification') || file == 'Dockerfile.notification') {
                changedServices.add('notification-svc')
            } else if (file.startsWith('services/matching') || file == 'Dockerfile.matching') {
                changedServices.add('matching-svc')
            } else if (file.startsWith('services/location') || file == 'Dockerfile.location') {
                changedServices.add('location-svc')
            } else if (file == 'gateway.py' || file == 'Dockerfile.gateway') {
                changedServices.add('gateway-svc')
            } else if (file == 'scripts/init_db.py' || file == 'Dockerfile.init') {
                changedServices.add('init-db')
            }
        }
        
        return changedServices.toList()
    } catch (Exception e) {
        echo "Error detecting changes: ${e.message}. Fallback to building all."
        return allServices
    }
}