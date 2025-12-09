pipeline {
  agent any

  environment {
    REGISTRY = "docker.io/${DOCKERHUB_USERNAME}"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    PYTHON_VERSION = "3.11"
    DOCKER_CREDENTIALS = 'dockerhub-credentials'
    KUBECONFIG_FILE = 'kubeconfig'
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
      }
    }

    stage('Unit Tests') {
      steps {
        sh ". .venv/bin/activate && pytest --maxfail=1 --disable-warnings -q || true"
      }
    }

    stage('SAST & Secret Scan') {
      steps {
        sh ". .venv/bin/activate && pip install bandit gitleaks pip-audit"
        sh ". .venv/bin/activate && bandit -r services common gateway.py -c bandit.yml"
        sh "gitleaks detect -c .gitleaks.toml --no-banner || true"
        sh ". .venv/bin/activate && pip-audit || true"
      }
    }

    stage('Build Images') {
      steps {
        script {
          def svcFiles = [
            [name: 'user-svc', dockerfile: 'Dockerfile.user'],
            [name: 'station-svc', dockerfile: 'Dockerfile.station'],
            [name: 'driver-svc', dockerfile: 'Dockerfile.driver'],
            [name: 'rider-svc', dockerfile: 'Dockerfile.rider'],
            [name: 'trip-svc', dockerfile: 'Dockerfile.trip'],
            [name: 'notification-svc', dockerfile: 'Dockerfile.notification'],
            [name: 'matching-svc', dockerfile: 'Dockerfile.matching'],
            [name: 'location-svc', dockerfile: 'Dockerfile.location'],
            [name: 'gateway-svc', dockerfile: 'Dockerfile.gateway']
          ]
          svcFiles.each { svc ->
            sh "docker build -f ${svc.dockerfile} -t ${REGISTRY}/${svc.name}:${IMAGE_TAG} -t ${REGISTRY}/${svc.name}:latest ."
          }
          sh "docker build -t ${REGISTRY}/lastmile-frontend:${IMAGE_TAG} -t ${REGISTRY}/lastmile-frontend:latest -f frontend/Dockerfile frontend"
        }
      }
    }

    stage('Container Scan (Trivy)') {
      steps {
        sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity HIGH,CRITICAL ${REGISTRY}/gateway-svc:${IMAGE_TAG} || true"
      }
    }

    stage('Push Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS, usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD')]) {
          sh "echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin"
          sh "docker push ${REGISTRY}/user-svc:${IMAGE_TAG} && docker push ${REGISTRY}/user-svc:latest"
          sh "docker push ${REGISTRY}/station-svc:${IMAGE_TAG} && docker push ${REGISTRY}/station-svc:latest"
          sh "docker push ${REGISTRY}/driver-svc:${IMAGE_TAG} && docker push ${REGISTRY}/driver-svc:latest"
          sh "docker push ${REGISTRY}/rider-svc:${IMAGE_TAG} && docker push ${REGISTRY}/rider-svc:latest"
          sh "docker push ${REGISTRY}/trip-svc:${IMAGE_TAG} && docker push ${REGISTRY}/trip-svc:latest"
          sh "docker push ${REGISTRY}/notification-svc:${IMAGE_TAG} && docker push ${REGISTRY}/notification-svc:latest"
          sh "docker push ${REGISTRY}/matching-svc:${IMAGE_TAG} && docker push ${REGISTRY}/matching-svc:latest"
          sh "docker push ${REGISTRY}/location-svc:${IMAGE_TAG} && docker push ${REGISTRY}/location-svc:latest"
          sh "docker push ${REGISTRY}/gateway-svc:${IMAGE_TAG} && docker push ${REGISTRY}/gateway-svc:latest"
          sh "docker push ${REGISTRY}/lastmile-frontend:${IMAGE_TAG} && docker push ${REGISTRY}/lastmile-frontend:latest"
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: KUBECONFIG_FILE, variable: 'KUBECONFIG')]) {
          sh "kubectl version --short"
          sh "kubectl apply -f k8s/namespace.yaml"
          sh "kubectl apply -n lastmile -f k8s/*.yaml"
          sh "kubectl set image deployment/user-svc user-svc=${REGISTRY}/user-svc:${IMAGE_TAG} -n lastmile --record"
          sh "kubectl set image deployment/station-svc station-svc=${REGISTRY}/station-svc:${IMAGE_TAG} -n lastmile --record"
          sh "kubectl set image deployment/driver-svc driver-svc=${REGISTRY}/driver-svc:${IMAGE_TAG} -n lastmile --record"
          sh "kubectl set image deployment/rider-svc rider-svc=${REGISTRY}/rider-svc:${IMAGE_TAG} -n lastmile --record"
          sh "kubectl set image deployment/trip-svc trip-svc=${REGISTRY}/trip-svc:${IMAGE_TAG} -n lastmile --record"
          sh "kubectl set image deployment/notification-svc notification-svc=${REGISTRY}/notification-svc:${IMAGE_TAG} -n lastmile --record"
          sh "kubectl set image deployment/matching-svc matching-svc=${REGISTRY}/matching-svc:${IMAGE_TAG} -n lastmile --record"
          sh "kubectl set image deployment/location-svc location-svc=${REGISTRY}/location-svc:${IMAGE_TAG} -n lastmile --record"
          sh "kubectl set image deployment/gateway gateway=${REGISTRY}/gateway-svc:${IMAGE_TAG} -n lastmile --record"
          sh "kubectl set image deployment/frontend frontend=${REGISTRY}/lastmile-frontend:${IMAGE_TAG} -n lastmile --record"
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
