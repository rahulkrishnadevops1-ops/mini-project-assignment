pipeline {
    agent any

    environment {
        DOCKERHUB_USER  = 'rahulkrishnadevops1ops'
        FRONTEND_IMAGE  = "${DOCKERHUB_USER}/kubecoin-frontend"
        BACKEND_IMAGE   = "${DOCKERHUB_USER}/kubecoin-backend"
        IMAGE_TAG       = "${BUILD_NUMBER}"
        SSH_KEY         = '/var/lib/jenkins/.ssh/id_rsa'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'git-creds',
                    url: 'https://github.com/rahulkrishnadevops1-ops/mini-project-assignment.git'
            }
        }

        stage('Terraform - Provision Infra') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                        export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                        export AWS_DEFAULT_REGION=ap-south-1

                        cd terraform
                        terraform init
                        terraform apply -auto-approve

                        # Save IPs for next stages
                        terraform output -raw master_public_ip > /tmp/master_ip.txt
                        terraform output -json worker_public_ips | tr -d '[]"' | tr ',' '\n' | tr -d ' ' > /tmp/worker_ips.txt

                        echo "Master IP: $(cat /tmp/master_ip.txt)"
                        echo "Worker IPs: $(cat /tmp/worker_ips.txt)"
                    '''
                }
            }
        }

        stage('Ansible - Setup K8s Cluster') {
    steps {
        withCredentials([
            string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
            string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
        ]) {
            sh '''
                export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                export AWS_DEFAULT_REGION=ap-south-1

                echo "Waiting 30s for EC2s to boot..."
                sleep 30

                cd ansible

                # Test dynamic inventory
                ansible-inventory -i inventory.aws_ec2.yml --list

                # Run playbook with dynamic inventory
                ansible-playbook -i inventory.aws_ec2.yml site.yml \
                    --private-key /var/lib/jenkins/.ssh/id_rsa \
                    -e "ansible_user=ubuntu" \
                    -e "ansible_ssh_common_args='-o StrictHostKeyChecking=no'"
            '''
        }
    }
}
        stage('Copy Kubeconfig') {
            steps {
                sh '''
                    MASTER_IP=$(cat /tmp/master_ip.txt)

                    # Wait for K8s to be fully ready
                    sleep 20

                    # Get kubeconfig from master
                    ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ubuntu@${MASTER_IP} \
                        "cat ~/.kube/config" > /tmp/kubeconfig

                    # Fix server IP
                    sed -i "s|https://127.0.0.1:6443|https://${MASTER_IP}:6443|g" /tmp/kubeconfig
                    sed -i "s|https://localhost:6443|https://${MASTER_IP}:6443|g" /tmp/kubeconfig

                    # Place for jenkins
                    mkdir -p /var/lib/jenkins/.kube
                    cp /tmp/kubeconfig /var/lib/jenkins/.kube/config

                    # Verify
                    kubectl --kubeconfig=/tmp/kubeconfig get nodes
                '''
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                }
            }
        }

        stage('Build & Push Images') {
            parallel {
                stage('Frontend') {
                    steps {
                        sh """
                            docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} ./kubecoin-frontend
                            docker tag  ${FRONTEND_IMAGE}:${IMAGE_TAG} ${FRONTEND_IMAGE}:latest
                            docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                            docker push ${FRONTEND_IMAGE}:latest
                        """
                    }
                }
                stage('Backend') {
                    steps {
                        sh """
                            docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} ./kubecoin-backend
                            docker tag  ${BACKEND_IMAGE}:${IMAGE_TAG} ${BACKEND_IMAGE}:latest
                            docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                            docker push ${BACKEND_IMAGE}:latest
                        """
                    }
                }
            }
        }

        stage('Helm Deploy') {
            steps {
                sh """
                    MASTER_IP=\$(cat /tmp/master_ip.txt)

                    # Copy helm chart to master
                    scp -i ${SSH_KEY} -o StrictHostKeyChecking=no \
                        -r helm/kubecoin ubuntu@\${MASTER_IP}:/tmp/kubecoin-helm

                    # Deploy
                    ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ubuntu@\${MASTER_IP} '
                        kubectl create namespace frontend --dry-run=client -o yaml | kubectl apply -f -
                        kubectl create namespace backend  --dry-run=client -o yaml | kubectl apply -f -
                        kubectl create namespace data     --dry-run=client -o yaml | kubectl apply -f -

                        helm upgrade --install kubecoin /tmp/kubecoin-helm \
                            --set backend.image.repository=${BACKEND_IMAGE} \
                            --set backend.image.tag=${IMAGE_TAG} \
                            --set frontend.image.repository=${FRONTEND_IMAGE} \
                            --set frontend.image.tag=${IMAGE_TAG} \
                            --wait --timeout 5m
                    '
                """
            }
        }

        stage('Verify') {
            steps {
                sh """
                    MASTER_IP=\$(cat /tmp/master_ip.txt)
                    ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ubuntu@\${MASTER_IP} '
                        echo "=== NODES ==="
                        kubectl get nodes
                        echo "=== PODS ==="
                        kubectl get pods -A
                        echo "=== SERVICES ==="
                        kubectl get svc -A
                    '
                """
            }
        }
    }

    post {
        success {
            echo '✅ KubeCoin deployed successfully!'
        }
        failure {
            echo '❌ Pipeline failed! Check logs above.'
        }
        always {
            sh 'docker logout || true'
        }
    }
}
