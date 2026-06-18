###############################################################################
# DevSync - EC2 Infrastructure (Jenkins + SonarQube + App Server)
###############################################################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "devsync"
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  }
}

###############################################################################
# Use the default VPC (simplest path; no extra networking cost)
###############################################################################
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

###############################################################################
# Latest Ubuntu 22.04 LTS AMI (Canonical, official)
###############################################################################
data "aws_ami" "ubuntu_22_04" {
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

###############################################################################
# Generate an SSH key pair locally and register it in AWS
###############################################################################
resource "tls_private_key" "devsync" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "devsync" {
  key_name   = "${var.project_name}-key"
  public_key = tls_private_key.devsync.public_key_openssh
}

# Save private key to disk so you can SSH (chmod 600 automatically applied)
resource "local_sensitive_file" "private_key" {
  content         = tls_private_key.devsync.private_key_pem
  filename        = "${path.module}/devsync-key.pem"
  file_permission = "0600"
}
