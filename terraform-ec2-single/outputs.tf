output "app_url" {
  description = "Your site once DNS points at the EIP and the bootstrap finishes (~10-15 min)"
  value       = "https://${var.domain}"
}

output "public_ip" {
  description = "Point your domain's A record at this IP"
  value       = aws_eip.app.public_ip
}

output "ssh" {
  description = "SSH into the box"
  value       = "ssh -i ${path.module}/devsync-key.pem ubuntu@${aws_eip.app.public_ip}"
}

output "watch_bootstrap" {
  description = "Tail the deploy log to watch it build & start"
  value       = "ssh -i ${path.module}/devsync-key.pem ubuntu@${aws_eip.app.public_ip} 'tail -f /var/log/user-data.log'"
}

output "create_admin" {
  description = "Create the Django admin user after deploy"
  value       = "ssh -i ${path.module}/devsync-key.pem ubuntu@${aws_eip.app.public_ip} 'cd /opt/devsync && docker compose exec backend python manage.py createsuperuser'"
}
