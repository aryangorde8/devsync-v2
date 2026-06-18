###############################################################################
# EC2 Instances
###############################################################################

# -----------------------------------------------------------------------------
# Jenkins (CI/CD server)
# -----------------------------------------------------------------------------
resource "aws_instance" "jenkins" {
  ami                         = data.aws_ami.ubuntu_22_04.id
  instance_type               = var.jenkins_instance_type
  key_name                    = aws_key_pair.devsync.key_name
  vpc_security_group_ids      = [aws_security_group.jenkins.id]
  subnet_id                   = data.aws_subnets.default.ids[0]
  associate_public_ip_address = true

  user_data = file("${path.module}/user_data/jenkins.sh")

  root_block_device {
    volume_size = var.root_volume_size_gb
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name = "${var.project_name}-jenkins"
    Role = "ci-cd"
  }
}

# -----------------------------------------------------------------------------
# SonarQube (code quality server)
# -----------------------------------------------------------------------------
resource "aws_instance" "sonarqube" {
  ami                         = data.aws_ami.ubuntu_22_04.id
  instance_type               = var.sonarqube_instance_type
  key_name                    = aws_key_pair.devsync.key_name
  vpc_security_group_ids      = [aws_security_group.sonarqube.id]
  subnet_id                   = data.aws_subnets.default.ids[0]
  associate_public_ip_address = true

  user_data = file("${path.module}/user_data/sonarqube.sh")

  root_block_device {
    volume_size = var.root_volume_size_gb
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name = "${var.project_name}-sonarqube"
    Role = "code-quality"
  }
}

# -----------------------------------------------------------------------------
# App (production application server)
# -----------------------------------------------------------------------------
resource "aws_eip" "app" {
  count    = var.use_elastic_ip ? 1 : 0
  domain   = "vpc"
  instance = aws_instance.app.id

  tags = {
    Name = "${var.project_name}-app-eip"
  }
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.ubuntu_22_04.id
  instance_type               = var.app_instance_type
  key_name                    = aws_key_pair.devsync.key_name
  vpc_security_group_ids      = [aws_security_group.app.id]
  subnet_id                   = data.aws_subnets.default.ids[0]
  associate_public_ip_address = true

  user_data = file("${path.module}/user_data/app.sh")

  root_block_device {
    volume_size = var.root_volume_size_gb
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name = "${var.project_name}-app"
    Role = "application"
  }
}
