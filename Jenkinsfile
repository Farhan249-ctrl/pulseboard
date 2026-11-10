pipeline {
  agent any
  environment {
    REGISTRY   = 'docker.io/farhan14031'
    IMAGE_TAG  = "${env.BUILD_NUMBER}"
    COMPOSE    = 'docker compose'
  }
  options { timestamps() }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install and test') {
      steps {
        sh '''
          docker network create pb-test || true
          docker run -d --rm --name pb-mongo --network pb-test mongo:7.0
          sleep 10
          docker run --rm --network pb-test -v "$PWD/backend:/app" -w /app \
            -e NODE_ENV=test -e MONGO_URI=mongodb://pb-mongo:27017/pulseboard_test \
            -e JWT_SECRET=ci_only_secret_at_least_32_characters_long \
            node:20-alpine sh -c "npm ci && npm test"
        '''
      }
      post {
        always { sh 'docker stop pb-mongo || true; docker network rm pb-test || true' }
      }
    }

    stage('Build images') {
      steps {
        sh '''
          docker build -t $REGISTRY/slotlock-backend:$IMAGE_TAG ./backend
          docker build -t $REGISTRY/slotlock-backend:v1 ./backend
          docker build -t $REGISTRY/slotlock-frontend:$IMAGE_TAG ./frontend
          docker build -t $REGISTRY/slotlock-frontend:v1 ./frontend
        '''
      }
    }

    stage('Push') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                         usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh '''
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
            docker push $REGISTRY/slotlock-backend:$IMAGE_TAG
            docker push $REGISTRY/slotlock-backend:v1
            docker push $REGISTRY/slotlock-frontend:$IMAGE_TAG
            docker push $REGISTRY/slotlock-frontend:v1
          '''
        }
      }
    }

    stage('Deploy') {
      steps {
        // Runs on the Docker host (EC2) agent; .env and certs/ live on that host, never in git.
        sh '$COMPOSE up -d --build'
      }
    }

    stage('Verify health') {
      steps {
        sh '''
          for i in $(seq 1 20); do
            curl -fsk https://localhost:${NGINX_HTTPS_PORT:-443}/api/health && exit 0
            sleep 5
          done
          $COMPOSE ps; $COMPOSE logs --tail 30; exit 1
        '''
      }
    }
  }

  post {
    always { sh '$COMPOSE ps || true' }
  }
}
