variable "aws_region" {
  default = "ap-south-1"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  default = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  default = "10.0.2.0/24"
}

variable "key_name" {
  description = "Nov-jenkins"
  type        = string
}

variable "jenkins_instance_type" {
  default = "m7i-flex.large"
}

variable "master_instance_type" {
  default = "c7i-flex.large"
}

variable "worker_instance_type" {
  default = "t3.small"
}

variable "my_ip" {
  description = "Your IP for SSH and Jenkins UI access"
  type        = string
}