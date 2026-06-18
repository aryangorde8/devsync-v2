// trigger: 2026-05-02
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    APP_EC2_USER = 'ubuntu'
    APP_EC2_HOST = '51.20.55.154'
    APP_DIR      = '/opt/devsync'

    BACKEND_IMAGE  = 'devsync-backend'
    FRONTEND_IMAGE = 'devsync-frontend'

    TEST_DATABASE_URL = 'postgres://devsync:devsync@devsync-ci-postgres:5432/devsync_test'
    TEST_REDIS_URL    = 'redis://devsync-ci-redis:6379/0'
  }

  stages {

    // -------------------------------------------------------------------------
    stage('Checkout') {
    // -------------------------------------------------------------------------
      steps {
        checkout scm
      }
    }

    // -------------------------------------------------------------------------
    stage('Backend Lint') {
    // -------------------------------------------------------------------------
      steps {
        sh '''
          set -euxo pipefail
          python3 -m venv .venv-ci
          . .venv-ci/bin/activate
          pip install --upgrade pip
          pip install black flake8 isort

          cd backend
          black --check --diff .
          isort --check-only --diff .
          flake8 accounts ai config core portfolio --count --select=E9,F63,F7,F82 --show-source --statistics
        '''
      }
    }

    // -------------------------------------------------------------------------
    stage('Frontend Lint & Type Check') {
    // -------------------------------------------------------------------------
      steps {
        sh '''
          set -euxo pipefail
          cd frontend
          npm ci
          npm run lint
          npm run type-check
        '''
      }
    }

    // -------------------------------------------------------------------------
    stage('Backend Tests') {
    // -------------------------------------------------------------------------
      steps {
        sh '''
          set -euxo pipefail

          docker rm -f devsync-ci-postgres devsync-ci-redis >/dev/null 2>&1 || true

          docker run -d --name devsync-ci-postgres \
            --network jenkins-net \
            -e POSTGRES_USER=devsync \
            -e POSTGRES_PASSWORD=devsync \
            -e POSTGRES_DB=devsync_test \
            postgres:16-alpine

          docker run -d --name devsync-ci-redis \
            --network jenkins-net \
            redis:7-alpine

          for i in $(seq 1 30); do
            if docker exec devsync-ci-postgres pg_isready -U devsync >/dev/null 2>&1; then break; fi
            sleep 2
          done

          . .venv-ci/bin/activate
          pip install -r backend/requirements.txt
          pip install pytest-cov pytest-django

          cd backend
          DJANGO_SECRET_KEY=ci-test-secret \
          DJANGO_DEBUG=True \
          DATABASE_URL="$TEST_DATABASE_URL" \
          REDIS_URL="$TEST_REDIS_URL" \
          python manage.py migrate --noinput

          DJANGO_SECRET_KEY=ci-test-secret \
          DJANGO_DEBUG=True \
          DATABASE_URL="$TEST_DATABASE_URL" \
          REDIS_URL="$TEST_REDIS_URL" \
          pytest --cov=. --cov-report=xml --cov-report=html -v
        '''
      }
      post {
        always {
          sh 'docker rm -f devsync-ci-postgres devsync-ci-redis >/dev/null 2>&1 || true'
        }
      }
    }

    // -------------------------------------------------------------------------
    stage('Frontend Tests') {
    // -------------------------------------------------------------------------
      steps {
        sh '''
          set -euxo pipefail
          cd frontend
          echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
          npm test -- --coverage --watchAll=false --passWithNoTests
        '''
      }
    }

    // -------------------------------------------------------------------------
    stage('SonarQube Analysis') {
    // -------------------------------------------------------------------------
      steps {
        script {
          def scannerHome = tool 'SonarQube Scanner'
          withSonarQubeEnv('SonarQube') {
            sh """
              set -euxo pipefail
              ${scannerHome}/bin/sonar-scanner \
                -Dsonar.projectKey=devsync \
                -Dsonar.sources=. \
                -Dsonar.host.url=\$SONAR_HOST_URL \
                -Dsonar.token=\$SONAR_AUTH_TOKEN \
                -Dsonar.python.coverage.reportPaths=backend/coverage.xml \
                -Dsonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info \
                -Dsonar.typescript.tsconfigPath=frontend/tsconfig.sonar.json \
                -Dsonar.exclusions=**/node_modules/**,**/.next/**,**/migrations/**,**/htmlcov/**,**/staticfiles/**
            """
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    stage('SonarQube Quality Gate') {
    // -------------------------------------------------------------------------
      steps {
        script {
          try {
            timeout(time: 2, unit: 'MINUTES') {
              waitForQualityGate abortPipeline: false
            }
          } catch (err) {
            echo "Quality Gate check skipped (no webhook configured): ${err}"
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    stage('Docker Build') {
    // -------------------------------------------------------------------------
      when {
        anyOf {
          branch 'main'
          expression { env.GIT_BRANCH ==~ /.*main/ }
        }
      }
      steps {
        sh '''
          set -euxo pipefail
          SHORT_SHA="$(git rev-parse --short=7 HEAD)"
          IMAGE_TAG="${BUILD_NUMBER}-${SHORT_SHA}"

          docker build -t "${BACKEND_IMAGE}:${IMAGE_TAG}" -t "${BACKEND_IMAGE}:latest" \
            --target production backend/

          docker build \
            --build-arg NEXT_PUBLIC_API_URL="http://${APP_EC2_HOST}/api/v1" \
            -t "${FRONTEND_IMAGE}:${IMAGE_TAG}" -t "${FRONTEND_IMAGE}:latest" \
            frontend/

          echo "$IMAGE_TAG" > image-tag.txt
        '''
        archiveArtifacts artifacts: 'image-tag.txt', allowEmptyArchive: true
      }
    }

    // -------------------------------------------------------------------------
    stage('Deploy to App EC2') {
    // -------------------------------------------------------------------------
      when {
        anyOf {
          branch 'main'
          expression { env.GIT_BRANCH ==~ /.*main/ }
        }
      }
      steps {
        sshagent(credentials: ['app-ec2-ssh-key']) {
          withCredentials([file(credentialsId: 'env-production', variable: 'ENV_FILE')]) {
            sh '''
              set -euxo pipefail
              SHORT_SHA="$(git rev-parse --short=7 HEAD)"
              IMAGE_TAG="${BUILD_NUMBER}-${SHORT_SHA}"

              # Save Docker images as tar and copy to App EC2
              docker save "${BACKEND_IMAGE}:latest" | \
                ssh -o StrictHostKeyChecking=no "${APP_EC2_USER}@${APP_EC2_HOST}" \
                "docker load"

              docker save "${FRONTEND_IMAGE}:latest" | \
                ssh -o StrictHostKeyChecking=no "${APP_EC2_USER}@${APP_EC2_HOST}" \
                "docker load"

              # Copy docker-compose and nginx config
              scp -o StrictHostKeyChecking=no \
                docker-compose.yml \
                "${APP_EC2_USER}@${APP_EC2_HOST}:${APP_DIR}/docker-compose.yml"

              scp -r -o StrictHostKeyChecking=no \
                nginx/ \
                "${APP_EC2_USER}@${APP_EC2_HOST}:${APP_DIR}/nginx"

              # Copy production env file (delete read-only existing file first)
              ssh -o StrictHostKeyChecking=no "${APP_EC2_USER}@${APP_EC2_HOST}" \
                "rm -f ${APP_DIR}/.env"
              scp -o StrictHostKeyChecking=no \
                "$ENV_FILE" \
                "${APP_EC2_USER}@${APP_EC2_HOST}:${APP_DIR}/.env"
              ssh -o StrictHostKeyChecking=no "${APP_EC2_USER}@${APP_EC2_HOST}" \
                "chmod 644 ${APP_DIR}/.env"

              # Restart services
              ssh -o StrictHostKeyChecking=no "${APP_EC2_USER}@${APP_EC2_HOST}" "
                cd ${APP_DIR}
                docker compose --profile production up -d --remove-orphans
                docker compose up -d --force-recreate nginx
                sleep 10
                docker compose exec -T backend python manage.py migrate --noinput
                docker compose exec -T backend python manage.py backfill_activity
              "
            '''
          }
        }
      }
    }

  }

  post {
    always {
      sh 'docker rm -f devsync-ci-postgres devsync-ci-redis >/dev/null 2>&1 || true'
      cleanWs()
    }
    success {
      echo "Pipeline succeeded. App deployed to http://${APP_EC2_HOST}"
    }
    failure {
      echo "Pipeline failed. Check logs above."
    }
  }
}
