# ── AMI ──────────────────────────────────────────────
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── VPC ──────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "kubecoin-vpc" }
}

# ── Internet Gateway ──────────────────────────────────
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "kubecoin-igw" }
}

# ── Subnets ───────────────────────────────────────────
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}a"
  tags                    = { Name = "kubecoin-public-subnet" }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidr
  availability_zone = "${var.aws_region}b"
  tags              = { Name = "kubecoin-private-subnet" }
}

# ── Route Table ───────────────────────────────────────
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = { Name = "kubecoin-public-rt" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# ── Security Groups ───────────────────────────────────

resource "aws_security_group" "k8s" {
  name        = "k8s-nodes-sg"
  description = "Kubernetes nodes communication"
  vpc_id      = aws_vpc.main.id

ingress {
  description = "SSH from anywhere (key-protected)"
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}

  ingress {
    description = "All traffic within cluster"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  ingress {
    description = "K8s API from local"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["${var.my_ip}/32"]
  }

  ingress {
    description = "NodePort access"
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "k8s-nodes-sg" }
}

# ── EC2 Instances ─────────────────────────────────────

resource "aws_instance" "master" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.master_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.k8s.id]
  key_name               = var.key_name

  tags = {
    Name    = "K8s-Master"
    Role    = "master"
    Cluster = "kubecoin"
  }
}

resource "aws_instance" "worker" {
  count                  = 2
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.worker_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.k8s.id]
  key_name               = var.key_name

  tags = {
    Name    = "K8s-Worker-${count.index + 1}"
    Role    = "workers"
    Cluster = "kubecoin"
  }
}
resource "aws_instance" "master" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.master_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.k8s.id]
  key_name               = var.key_name
  user_data              = local.bootstrap_script   # ← ADD THIS

  tags = {
    Name    = "K8s-Master"
    Role    = "master"
    Cluster = "kubecoin"
  }
}

resource "aws_instance" "worker" {
  count                  = 2
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.worker_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.k8s.id]
  key_name               = var.key_name
  user_data              = local.bootstrap_script   # ← ADD THIS

  tags = {
    Name    = "K8s-Worker-${count.index + 1}"
    Role    = "workers"
    Cluster = "kubecoin"
  }
}
locals {
  bootstrap_script = <<-EOF
    #!/bin/bash
    set -e
    swapoff -a
    sed -i 's/^([^#].*\s+swap\s+.*)$/# \1/' /etc/fstab
    modprobe overlay && modprobe br_netfilter
    cat >> /etc/modules-load.d/k8s.conf << EOL
overlay
br_netfilter
EOL
    cat >> /etc/sysctl.d/k8s.conf << EOL
net.bridge.bridge-nf-call-iptables=1
net.bridge.bridge-nf-call-ip6tables=1
net.ipv4.ip_forward=1
EOL
    sysctl --system
    apt-get update -y
    apt-get install -y apt-transport-https ca-certificates curl gnupg containerd
    mkdir -p /etc/containerd /etc/apt/keyrings
    containerd config default > /etc/containerd/config.toml
    sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
    systemctl restart containerd && systemctl enable containerd
    curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
    echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' > /etc/apt/sources.list.d/kubernetes.list
    apt-get update -y
    apt-get install -y kubelet kubeadm kubectl
    apt-mark hold kubelet kubeadm kubectl
    systemctl enable kubelet
    touch /tmp/bootstrap-done
  EOF
}
