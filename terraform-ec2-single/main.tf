###############################################################################
# DevSync v2 — single-instance AWS deploy (Terraform-driven, Python-only)
# One t3.medium runs the whole stack (Postgres + Redis + Django + Celery +
# Caddy) via Docker Compose. ~$30-34/month. The instance self-deploys on boot
# and then keeps itself up to date from `main` via a systemd pull timer.
###############################################################################

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws   = { source = "hashicorp/aws", version = "~> 5.0" }
    tls   = { source = "hashicorp/tls", version = "~> 4.0" }
    local = { source = "hashicorp/local", version = "~> 2.0" }
  }
}

provider "aws" {
  region = var.region
}

# Latest Ubuntu 22.04 LTS (Canonical)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Use the account's default VPC (keeps it simple and free)
data "aws_vpc" "default" {
  default = true
}

# ---- SSH key (generated; private key saved locally as devsync-key.pem) -------
resource "tls_private_key" "key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "key" {
  key_name   = var.key_name
  public_key = tls_private_key.key.public_key_openssh
}

resource "local_sensitive_file" "pem" {
  content         = tls_private_key.key.private_key_pem
  filename        = "${path.module}/devsync-key.pem"
  file_permission = "0600"
}

# ---- Security group ----------------------------------------------------------
resource "aws_security_group" "app" {
  name        = "devsync-v2-single-sg"
  description = "DevSync v2 single-instance: SSH (your IP), HTTP/HTTPS (world)"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "devsync-v2-single-sg" }
}

# ---- The instance ------------------------------------------------------------
resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.key.key_name
  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = templatefile("${path.module}/user_data.sh", {
    repo_url = var.repo_url
    domain   = var.domain
  })

  root_block_device {
    volume_size = var.root_volume_gb
    volume_type = "gp3"
  }

  tags = { Name = "devsync-v2-app" }
}

# ---- Stable public IP --------------------------------------------------------
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"
  tags     = { Name = "devsync-v2-app-eip" }
}
