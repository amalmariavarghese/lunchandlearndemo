
pipeline {
  agent any

  environment {
    // Change these to your values
    AZ_SUBSCRIPTION = 'YOUR_SUBSCRIPTION_ID'
    AZ_RESOURCE_GROUP = 'rg-jenkins-demo'
    WEBAPP_NAME = 'jenkins-demo-web'
    ACR_NAME = 'mydemoacr'                     // without .azurecr.io
    IMAGE_NAME = 'jenkins-azure-demo'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    ACR_LOGIN_SERVER = "${ACR_NAME}.azurecr.io"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Node & Test') {
      steps {
        sh '''
          node -v || curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs
          npm ci
          npm test
        '''
      }
    }

    stage('Build Docker Image') {
      steps {
        sh '''
          docker build -t ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG} .
        '''
      }
    }

    stage('Azure Login') {
      steps {
        withCredentials([
          usernamePassword(credentialsId: 'AZURE_SP_APPID', usernameVariable: 'AZ_APPID', passwordVariable: 'AZ_PASSWORD'),
          string(credentialsId: 'AZURE_TENANT_ID', variable: 'AZ_TENANT')
        ]) {
          sh '''
            # Install Azure CLI if not present
            az version || (curl -sL https://aka.ms/InstallAzureCLIDeb | bash)
            az login --service-principal -u "$AZ_APPID" -p "$AZ_PASSWORD" --tenant "$AZ_TENANT"
            az account set --subscription "${AZ_SUBSCRIPTION}"
          '''
        }
      }
    }

    stage('Push to ACR') {
      steps {
        sh '''
          az acr login --name ${ACR_NAME}
          docker push ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}
        '''
      }
    }

    stage('Deploy to Azure Web App for Containers') {
      steps {
        sh '''
          az webapp config container set \
            --name ${WEBAPP_NAME} \
            --resource-group ${AZ_RESOURCE_GROUP} \
            --docker-custom-image-name ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG} \
            --docker-registry-server-url https://${ACR_LOGIN_SERVER}

          # Optionally, set startup command or env vars
          # az webapp config appsettings set --name ${WEBAPP_NAME} --resource-group ${AZ_RESOURCE_GROUP} --settings WEBSITES_PORT=3000

          # Restart to pick up new container config
          az webapp restart --name ${WEBAPP_NAME} --resource-group ${AZ_RESOURCE_GROUP}
        '''
      }
    }
  }

  post {
    success {
      echo "Deployed ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG} to ${WEBAPP_NAME}"
    }
    failure {
      echo "Build failed. Check stage logs."
    }
  }
}
