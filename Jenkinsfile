pipeline {
  agent any

  environment {
    // ====== CHANGE THESE ======
    ACR_LOGIN_SERVER = 'lunchandlearndemo.azurecr.io'  // e.g., lunchandlearnacr.azurecr.io
    ACR_REPO         = 'LunchandlearnDemo'       // repo name inside ACR
    WEBAPP_NAME      = 'LunchandlearnDemo'       // App Service name
    IMAGE_TAG        = "${env.BUILD_NUMBER}"     // immutable tag
    // ==========================

    // Kudu SCM endpoint
    KUDU_BASE = "https://${WEBAPP_NAME}.scm.azurewebsites.net"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build Image') {
      steps {
        sh """
          docker build -t ${ACR_LOGIN_SERVER}/${ACR_REPO}:${IMAGE_TAG} .
          docker tag  ${ACR_LOGIN_SERVER}/${ACR_REPO}:${IMAGE_TAG} ${ACR_LOGIN_SERVER}/${ACR_REPO}:latest
        """
      }
    }

    stage('Push to ACR (Admin Credentials)') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'az_admin_user', usernameVariable: 'ACR_USER', passwordVariable: 'ACR_PASS')]) {
          sh """
            echo "$ACR_PASS" | docker login ${ACR_LOGIN_SERVER} -u "$ACR_USER" --password-stdin
            docker push ${ACR_LOGIN_SERVER}/${ACR_REPO}:${IMAGE_TAG}
            docker push ${ACR_LOGIN_SERVER}/${ACR_REPO}:latest
            docker logout ${ACR_LOGIN_SERVER}
          """
        }
      }
    }

    stage('Deploy (Restart Web App via Kudu)') {
      steps {
        // Publish Profile XML from the Web App (store as secret text)
        withCredentials([string(credentialsId: 'WEBAPP_PUBLISH_PROFILE_XML', variable: 'PUBLISH_XML')]) {
          sh '''
            # Extract Kudu Basic Auth creds from publish profile
            # We grab the first profile (works for typical single-site publish profile)
            KUDU_USER=$(echo "$PUBLISH_XML" | sed -n 's/.*userName="\\([^"]*\\)".*/\\1/p' | head -n1)
            KUDU_PASS=$(echo "$PUBLISH_XML" | sed -n 's/.*userPWD="\\([^"]*\\)".*/\\1/p'   | head -n1)

            # Restart site -> App Service re-pulls :latest from ACR
            curl -sS -X POST -u "$KUDU_USER:$KUDU_PASS" \
                 -H "Content-Length: 0" \
                 "${KUDU_BASE}/api/app/restart" -i
          '''
        }
      }
    }

    stage('Smoke Test') {
      steps {
        sh "sleep 10 && curl -sSf https://${WEBAPP_NAME}.azurewebsites.net | head -n 5"
      }
    }
  }

  post {
    success {
      echo "Pushed ${ACR_LOGIN_SERVER}/${ACR_REPO}:${IMAGE_TAG} and restarted ${WEBAPP_NAME}."
    }
    failure {
      echo "Pipeline failed. Check the stage logs above."
    }
  }
}
