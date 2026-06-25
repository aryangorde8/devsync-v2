variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1" # Mumbai
}

variable "instance_type" {
  description = "EC2 size. t3.medium (2 vCPU / 4 GB) runs the full stack. NOT free-tier."
  type        = string
  default     = "t3.medium"
}

variable "my_ip_cidr" {
  description = "Your public IP for SSH access, e.g. \"1.2.3.4/32\". Get it with: curl ifconfig.me"
  type        = string
}

variable "key_name" {
  description = "Name for the generated AWS key pair"
  type        = string
  default     = "devsync-v2-key"
}

variable "repo_url" {
  description = "Public git repo the instance clones, deploys, and auto-updates from"
  type        = string
  default     = "https://github.com/aryangorde8/devsync-v2.git"
}

variable "domain" {
  description = "Domain Caddy serves (must point at this instance's EIP for TLS). Must match the Caddyfile."
  type        = string
  default     = "devsync.aryangorde.com"
}

variable "root_volume_gb" {
  description = "Root disk size (GB). Docker images + builds need room."
  type        = number
  default     = 30
}
