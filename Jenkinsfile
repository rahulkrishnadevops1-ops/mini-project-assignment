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
                sh '''
MASTER_IP=$(cat /tmp/master_ip.txt)
WORKER1=$(sed -n '1p' /tmp/worker_ips.txt)
WORKER2=$(sed -n '2p' /tmp/worker_ips.txt)

cat > /tmp/inventory.ini << EOF
[master]
${MASTER_IP} ansible_user=ubuntu ansible_ssh_private_key_file=/var/lib/jenkins/.ssh/id_rsa ansible_ssh_common_args='-o StrictHostKeyChecking=no'

[workers]
${WORKER1} ansible_user=ubuntu ansible_ssh_private_key_file=/var/lib/jenkins/.ssh/id_rsa ansible_ssh_common_args='-o StrictHostKeyChecking=no'
${WORKER2} ansible_user=ubuntu ansible_ssh_private_key_file=/var/lib/jenkins/.ssh/id_rsa ansible_ssh_common_args='-o StrictHostKeyChecking=no'

[k8s:children]
master
workers
EOF

echo "=== Generated inventory ==="
cat /tmp/inventory.ini

echo "=== Waiting for bootstrap-done on master ==="
RETRIES=0
until ssh -i /var/lib/jenkins/.ssh/id_rsa \
    -o StrictHostKeyChecking=no \
    -o ConnectTimeout=10 \
    ubuntu@${MASTER_IP} "test -f /tmp/bootstrap-done && echo ready" 2>/dev/null | grep -q ready; do
    RETRIES=$((RETRIES+1))
    echo "Retry ${RETRIES}/30 - waiting for bootstrap..."
    if [ $RETRIES -ge 30 ]; then
        echo "ERROR: Bootstrap timeout after 30 retries"
        exit 1
    fi
    sleep 20
done
echo "Bootstrap complete on master ✅"

echo "=== Running Ansible ==="
ansible-playbook -i /tmp/inventory.ini ansible/site.yml -v 2>&1 | tee ansible-output.log
ANSIBLE_EXIT=${PIPESTATUS[0]}
echo "=== Ansible Exit Code: ${ANSIBLE_EXIT} ==="
# Exit code 0 = success no changes, 2 = success with changes — both are OK
if [ ${ANSIBLE_EXIT} -ne 0 ] && [ ${ANSIBLE_EXIT} -ne 2 ]; then
    echo "Ansible FAILED with exit code ${ANSIBLE_EXIT}"
    exit ${ANSIBLE_EXIT}
fi
echo "Ansible completed successfully ✅"
                '''
            }
        }

        stage('Copy Kubeconfig') {
            steps {
                sh '''
                    MASTER_IP=$(cat /tmp/master_ip.txt)

                    sleep 20

                    ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ubuntu@${MASTER_IP} \
                        "cat ~/.kube/config" > /tmp/kubeconfig

                    sed -i "s|https://127.0.0.1:6443|https://${MASTER_IP}:6443|g" /tmp/kubeconfig
                    sed -i "s|https://localhost:6443|https://${MASTER_IP}:6443|g" /tmp/kubeconfig

                    mkdir -p /var/lib/jenkins/.kube
                    cp /tmp/kubeconfig /var/lib/jenkins/.kube/config

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

                    scp -i ${SSH_KEY} -o StrictHostKeyChecking=no \
                        -r helm/kubecoin ubuntu@\${MASTER_IP}:/tmp/kubecoin-helm

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
            echo '❌ Pipeline failed! Running terraform destroy to clean up...'
            withCredentials([
                string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
            ]) {
                sh '''
                    export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                    export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                    export AWS_DEFAULT_REGION=ap-south-1

                    cd terraform
                    terraform init -reconfigure || true
                    terraform destroy -auto-approve || true
                    echo "🧹 Infrastructure destroyed!"
                '''
            }
        }
        always {
            sh 'docker logout || true'
        }
    }
}
