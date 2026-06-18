###############################################################################
# Outputs — printed after `terraform apply`
###############################################################################

output "aws_region" {
  description = "AWS region (used by manage.sh)"
  value       = var.aws_region
}

output "jenkins_public_ip" {
  description = "Jenkins server public IP"
  value       = aws_instance.jenkins.public_ip
}

output "jenkins_url" {
  description = "Jenkins web UI URL"
  value       = "http://${aws_instance.jenkins.public_ip}:8080"
}

output "sonarqube_public_ip" {
  description = "SonarQube server public IP"
  value       = aws_instance.sonarqube.public_ip
}

output "sonarqube_private_ip" {
  description = "SonarQube private IP (use this in Jenkins SonarQube server URL)"
  value       = aws_instance.sonarqube.private_ip
}

output "sonarqube_url" {
  description = "SonarQube web UI URL"
  value       = "http://${aws_instance.sonarqube.public_ip}:9000"
}

output "app_public_ip" {
  description = "App server public IP (changes after stop/start unless use_elastic_ip=true)"
  value       = var.use_elastic_ip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip
}

output "app_url" {
  description = "App URL"
  value       = "http://${var.use_elastic_ip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip}"
}

output "ssh_jenkins" {
  description = "SSH command for Jenkins server"
  value       = "ssh -i ${path.module}/devsync-key.pem ubuntu@${aws_instance.jenkins.public_ip}"
}

output "ssh_sonarqube" {
  description = "SSH command for SonarQube server"
  value       = "ssh -i ${path.module}/devsync-key.pem ubuntu@${aws_instance.sonarqube.public_ip}"
}

output "ssh_app" {
  description = "SSH command for App server"
  value       = "ssh -i ${path.module}/devsync-key.pem ubuntu@${var.use_elastic_ip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip}"
}

output "instance_ids" {
  description = "Instance IDs (used by manage.sh start/stop script)"
  value = {
    jenkins   = aws_instance.jenkins.id
    sonarqube = aws_instance.sonarqube.id
    app       = aws_instance.app.id
  }
}

output "next_steps" {
  description = "What to do after apply finishes"
  value       = <<-EOT

  ============================================================================
  Infrastructure ready. Next steps:
  ============================================================================

  1. Wait ~3 minutes for user-data scripts to finish on all 3 instances.

  2. Get the Jenkins admin password:
       ssh -i ${path.module}/devsync-key.pem ubuntu@${aws_instance.jenkins.public_ip} \\
         "sudo cat /var/lib/jenkins/secrets/initialAdminPassword"

  3. Get Jenkins's deploy public key:
       ssh -i ${path.module}/devsync-key.pem ubuntu@${aws_instance.jenkins.public_ip} \\
         "sudo cat /var/lib/jenkins/.ssh/devsync_deploy.pub"

  4. Add that public key to the App server's authorized_keys:
       ssh -i ${path.module}/devsync-key.pem ubuntu@${(var.use_elastic_ip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip)} \\
         "echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys"

  5. Get Jenkins's deploy private key (to add as Jenkins credential):
       ssh -i ${path.module}/devsync-key.pem ubuntu@${aws_instance.jenkins.public_ip} \\
         "sudo cat /var/lib/jenkins/.ssh/devsync_deploy"

  6. Open Jenkins:        http://${aws_instance.jenkins.public_ip}:8080
     Open SonarQube:      http://${aws_instance.sonarqube.public_ip}:9000
                          (login: admin / admin — change immediately)

  7. In the Jenkinsfile, set:
       APP_EC2_HOST = '${(var.use_elastic_ip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip)}'

  ============================================================================
  EOT
}
