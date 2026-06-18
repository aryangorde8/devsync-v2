# DevSync Terraform Infrastructure

This directory contains Infrastructure as Code (IaC) for deploying DevSync to AWS using Terraform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                           VPC (10.0.0.0/16)                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │  │
│  │  │  Public Subnet  │  │  Public Subnet  │  │  Public Subnet  │   │  │
│  │  │   (us-east-1a)  │  │   (us-east-1b)  │  │   (us-east-1c)  │   │  │
│  │  │       ALB       │  │                 │  │                 │   │  │
│  │  └────────┬────────┘  └─────────────────┘  └─────────────────┘   │  │
│  │           │                                                       │  │
│  │  ┌────────┴────────┐  ┌─────────────────┐  ┌─────────────────┐   │  │
│  │  │ Private Subnet  │  │ Private Subnet  │  │ Private Subnet  │   │  │
│  │  │   (us-east-1a)  │  │   (us-east-1b)  │  │   (us-east-1c)  │   │  │
│  │  │                 │  │                 │  │                 │   │  │
│  │  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │   │  │
│  │  │  │  EKS Node │  │  │  │  EKS Node │  │  │  │  EKS Node │  │   │  │
│  │  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │   │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘   │  │
│  │                                                                   │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                        │  │
│  │  │  Database Subnet │  │  Database Subnet │                       │  │
│  │  │   ┌─────────┐   │  │   (Multi-AZ)    │                        │  │
│  │  │   │   RDS   │───┼──┼─► (Standby)     │                        │  │
│  │  │   │PostgreSQL│  │  │                 │                        │  │
│  │  │   └─────────┘   │  └─────────────────┘                        │  │
│  │  └─────────────────┘                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ ElastiCache  │  │     S3       │  │   Secrets    │                   │
│  │    Redis     │  │   Buckets    │  │   Manager    │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.5.0
3. **kubectl** for Kubernetes management
4. **AWS account** with permissions to create resources

## Quick Start

```bash
# 1. Initialize Terraform
terraform init

# 2. Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 3. Set sensitive variables
export TF_VAR_db_password="your-secure-password"

# 4. Plan the deployment
terraform plan

# 5. Apply the configuration
terraform apply

# 6. Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name devsync
```

## Files Structure

```
terraform/
├── main.tf              # Provider configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── vpc.tf               # VPC and networking
├── eks.tf               # EKS cluster configuration
├── rds.tf               # PostgreSQL database
├── elasticache.tf       # Redis cache
├── s3.tf                # S3 buckets
└── terraform.tfvars.example
```

## Resources Created

| Resource | Description |
|----------|-------------|
| VPC | Isolated network with public/private subnets |
| EKS | Managed Kubernetes cluster |
| RDS PostgreSQL | Primary database |
| ElastiCache Redis | Caching layer |
| S3 Buckets | Media, static assets, backups |
| IAM Roles | IRSA for pod-level permissions |
| Security Groups | Network access control |
| Secrets Manager | Secure credential storage |

## Cost Estimation (us-east-1)

| Service | Configuration | Est. Monthly Cost |
|---------|---------------|-------------------|
| EKS | Control plane | ~$73 |
| EC2 (2x t3.medium) | Worker nodes | ~$60 |
| RDS (db.t3.micro) | PostgreSQL | ~$15 |
| ElastiCache (cache.t3.micro) | Redis | ~$12 |
| NAT Gateway | Single AZ | ~$32 |
| S3 | Minimal usage | ~$1 |
| **Total** | | **~$193/month** |

*Note: Enable `single_nat_gateway = true` for dev environments to reduce costs.*

## Security Features

- ✅ Private subnets for workloads
- ✅ Encrypted RDS storage
- ✅ Encrypted S3 buckets
- ✅ IRSA for pod-level IAM
- ✅ VPC Flow Logs enabled
- ✅ Security groups with minimal permissions
- ✅ Secrets Manager for credentials

## Scaling

The EKS cluster uses Horizontal Pod Autoscaler (HPA) and Cluster Autoscaler. Configure in `eks.tf`:

```hcl
node_min_size     = 1
node_max_size     = 10
node_desired_size = 2
```

## Destroy

```bash
# Destroy all resources (be careful!)
terraform destroy
```

## Troubleshooting

### kubectl can't connect to cluster

```bash
aws eks update-kubeconfig --region us-east-1 --name devsync
```

### Terraform state locking

Enable remote state with DynamoDB:

```hcl
backend "s3" {
  bucket         = "devsync-terraform-state"
  key            = "infrastructure/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "devsync-terraform-locks"
}
```
