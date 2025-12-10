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

    stage('Build Images') {
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
            'gateway-svc': 'Dockerfile.gateway'
          ]
          
          def builds = [:]
          
          svcFiles.each { name, dockerfile ->
            builds[name] = {
              sh "docker build -f ${dockerfile} -t ${REGISTRY}/${name}:${IMAGE_TAG} -t ${REGISTRY}/${name}:latest ."
            }
          }
          
          builds['lastmile-frontend'] = {
            sh "docker build -t ${REGISTRY}/lastmile-frontend:${IMAGE_TAG} -t ${REGISTRY}/lastmile-frontend:latest -f frontend/Dockerfile frontend"
          }
          
          parallel builds
        }
      }
    }

    stage('Container Scan (Trivy)') {
      steps {
        script {
           def services = ['user-svc', 'station-svc', 'driver-svc', 'rider-svc', 'trip-svc', 'notification-svc', 'matching-svc', 'location-svc', 'gateway-svc']
           def scans = [:]
           
           services.each { svc ->
             scans[svc] = {
               echo "Scanning ${svc}..."
               // Added --user 0, :z, and --privileged to fix permission issues
               sh "docker run --privileged --rm -u 0 -v /var/run/docker.sock:/var/run/docker.sock:z aquasec/trivy:latest image --severity HIGH,CRITICAL ${REGISTRY}/${svc}:${IMAGE_TAG} || true"
             }
           }
           
           parallel scans
        }
      }
    }

    stage('Push Images') {
      steps {
        script {
          sh "echo $DOCKERHUB_CREDS_PSW | docker login -u $DOCKERHUB_CREDS_USR --password-stdin"
          
          def images = ['user-svc', 'station-svc', 'driver-svc', 'rider-svc', 'trip-svc', 'notification-svc', 'matching-svc', 'location-svc', 'gateway-svc', 'lastmile-frontend']
          def pushes = [:]
          
          images.each { img ->
            pushes[img] = {
              sh "docker push ${REGISTRY}/${img}:${IMAGE_TAG} && docker push ${REGISTRY}/${img}:latest"
            }
          }
          
          parallel pushes
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          script {
            // Apply manifests (idempotent - safe to run every time)
            sh ". .venv/bin/activate && ansible-playbook -i ansible/inventory ansible/playbooks/site.yml"
            
            // Update all service images to the newly built version
            def services = ['user-svc', 'station-svc', 'driver-svc', 'rider-svc', 'trip-svc', 'notification-svc', 'matching-svc', 'location-svc', 'gateway']
            def updates = [:]
            
            services.each { svc ->
              updates[svc] = {
                // For gateway, the container name is 'gateway' but image is 'gateway-svc'
                def imageName = (svc == 'gateway') ? 'gateway-svc' : svc
                sh "kubectl set image deployment/${svc} ${svc}=${REGISTRY}/${imageName}:${IMAGE_TAG} -n lastmile"
              }
            }
            
            updates['frontend'] = {
              sh "kubectl set image deployment/frontend frontend=${REGISTRY}/lastmile-frontend:${IMAGE_TAG} -n lastmile"
            }
            
            parallel updates
            
            // Wait for critical services to be ready
            sh "kubectl rollout status deployment/gateway -n lastmile --timeout=180s"
            sh "kubectl rollout status deployment/frontend -n lastmile --timeout=180s"
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
