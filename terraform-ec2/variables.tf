###############################################################################
# Input Variables
###############################################################################

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1" # Mumbai — change to your region (e.g. us-east-1)
}

variable "project_name" {
  description = "Project name (used as resource prefix)"
  type        = string
  default     = "devsync"
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
  default     = "prod"
}

variable "my_ip_cidr" {
  description = "Your public IP in CIDR form (e.g. 203.0.113.42/32). Used to lock down SSH and admin UIs. Find via: curl ifconfig.me"
  type        = string
  # No default — you must provide this in terraform.tfvars
}

variable "jenkins_instance_type" {
  description = "EC2 instance type for Jenkins server"
  type        = string
  default     = "t3.small" # 2 vCPU / 2 GB RAM — enough for student demo
}

variable "sonarqube_instance_type" {
  description = "EC2 instance type for SonarQube server (must be >=3GB RAM)"
  type        = string
  default     = "t3.medium" # 2 vCPU / 4 GB RAM — SonarQube minimum
}

variable "app_instance_type" {
  description = "EC2 instance type for the production application server"
  type        = string
  default     = "t3.small" # 2 vCPU / 2 GB RAM
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size for each instance (GB)"
  type        = number
  default     = 20 # smaller = cheaper while stopped
}

variable "use_elastic_ip" {
  description = "Allocate Elastic IP for App server. WARNING: EIP costs ~$3.60/mo when instance is STOPPED. Set false for student demo."
  type        = bool
  default     = false
}
