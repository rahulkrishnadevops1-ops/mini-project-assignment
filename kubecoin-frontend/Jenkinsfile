pipeline {
    agent any

    environment {
        DOCKER_CREDENTIALS = 'docker-creds'
        GIT_CREDENTIALS = 'git-creds'
        DOCKER_REGISTRY = 'privatergistry'

        IMAGE_NAME = 'kubecoin-frontend'
        IMAGE_REPOSITORY = "${DOCKER_REGISTRY}/${IMAGE_NAME}"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        IMAGE_FULL = "${IMAGE_REPOSITORY}:${IMAGE_TAG}"
        IMAGE_LATEST = "${IMAGE_REPOSITORY}:latest"

        HELM_REPO_URL = 'https://github.com/Narendra-Geddam/kubecoin-helm.git'
        HELM_BRANCH = 'main'
        HELM_VALUES_FILE = 'kubecoin/values.yaml'
    }

    triggers { pollSCM('H/2 * * * *') }

    stages {
        stage('Build and Push Image') {
            agent {
                kubernetes {
                    cloud 'kubernetes'
                    yaml '''
apiVersion: v1
kind: Pod
metadata:
  namespace: jenkins
spec:
  serviceAccountName: jenkins
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command:
    - /busybox/cat
    tty: true
'''
                }
            }

            steps {
                checkout scm

                container('kaniko') {
                    withCredentials([usernamePassword(
                        credentialsId: DOCKER_CREDENTIALS,
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )]) {
                        sh '''
                            set -e

                            AUTH=$(echo -n "${DOCKER_USERNAME}:${DOCKER_PASSWORD}" | base64 | tr -d '\n')
                            mkdir -p /kaniko/.docker
                            cat > /kaniko/.docker/config.json <<EOF
{"auths":{"${DOCKER_REGISTRY}":{"auth":"${AUTH}"}}}
EOF

                            /kaniko/executor \
                              --context "${WORKSPACE}" \
                              --dockerfile "${WORKSPACE}/Dockerfile" \
                              --destination "${IMAGE_FULL}" \
                              --destination "${IMAGE_LATEST}" \
                              --insecure \
                              --skip-tls-verify
                        '''
                    }
                }
            }
        }

        stage('Update Helm Image Tag') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: GIT_CREDENTIALS,
                    usernameVariable: 'GIT_USERNAME',
                    passwordVariable: 'GIT_PASSWORD'
                )]) {
                    sh '''
                        set -e
                        rm -rf helm-repo

                        CLEAN_HELM_URL=${HELM_REPO_URL#https://}
                        git clone -b ${HELM_BRANCH} https://${GIT_USERNAME}:${GIT_PASSWORD}@${CLEAN_HELM_URL} helm-repo

                        sed -i "/^frontend:/,/^[^ ]/ s|^    repository: .*|    repository: ${IMAGE_REPOSITORY}|" helm-repo/${HELM_VALUES_FILE}
                        sed -i "/^frontend:/,/^[^ ]/ s|^    tag: .*|    tag: \"${IMAGE_TAG}\"|" helm-repo/${HELM_VALUES_FILE}

                        cd helm-repo
                        git config user.name "jenkins"
                        git config user.email "jenkins@local"
                        git add ${HELM_VALUES_FILE}

                        if git diff --cached --quiet; then
                          echo "No Helm changes to commit."
                          exit 0
                        fi

                        git commit -m "ci(frontend): update image to ${IMAGE_TAG}"
                        git push origin ${HELM_BRANCH}
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'rm -rf helm-repo || true'
        }
    }
}
