# DevSync — EC2 Infrastructure (Terraform)

Provisions 3 EC2 instances on AWS for the Jenkins + SonarQube + App deployment.

## What gets created

| Resource | Type | Purpose |
|----------|------|---------|
| 1× EC2 (`t3.medium`) | Jenkins server | CI/CD pipeline runner |
| 1× EC2 (`t3.medium`) | SonarQube server | Code-quality analysis |
| 1× EC2 (`t3.medium`) | Application server | Production app via Docker Compose |
| 1× Elastic IP | App | Stable public IP for the app |
| 3× Security Groups | — | Network rules locked to your IP |
| 1× SSH Key Pair | — | Auto-generated, saved as `devsync-key.pem` |

All instances boot with a `user_data` script that installs everything (Docker, Jenkins, SonarQube container, etc.) — **zero manual SSH setup needed for the basics**.

---

## Prerequisites

1. **Terraform** ≥ 1.5  → https://developer.hashicorp.com/terraform/downloads
2. **AWS CLI** configured with credentials → `aws configure`
3. Your **public IP** → `curl ifconfig.me`

---

## Deploy

```bash
cd terraform-ec2

# 1. Configure your variables
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars      # set my_ip_cidr to "<YOUR_IP>/32"

# 2. Initialize providers
terraform init

# 3. Preview what will be created
terraform plan

# 4. Create everything (~2-3 min)
terraform apply

# 5. Read the printed instructions in the "next_steps" output
```

After `apply`, all IPs and SSH commands are printed. The private SSH key is saved to `devsync-key.pem` (chmod 600 automatically).

---

## After deploy — manual hookup

The user-data scripts handle install, but you still need to wire the 3 servers together:

1. **Get Jenkins admin password:**
   ```bash
   ssh -i devsync-key.pem ubuntu@<JENKINS_IP> \
     "sudo cat /var/lib/jenkins/secrets/initialAdminPassword"
   ```

2. **Get Jenkins's deploy public key, add to App EC2:**
   ```bash
   # On Jenkins:
   ssh -i devsync-key.pem ubuntu@<JENKINS_IP> \
     "sudo cat /var/lib/jenkins/.ssh/devsync_deploy.pub"

   # On App EC2 (paste the key):
   ssh -i devsync-key.pem ubuntu@<APP_IP> \
     "echo 'PASTE_KEY_HERE' >> ~/.ssh/authorized_keys"
   ```

3. **Get Jenkins's deploy private key (add as Jenkins credential `app-ec2-ssh-key`):**
   ```bash
   ssh -i devsync-key.pem ubuntu@<JENKINS_IP> \
     "sudo cat /var/lib/jenkins/.ssh/devsync_deploy"
   ```

4. **Open SonarQube** (http://<SONAR_IP>:9000), login `admin`/`admin`, change password, generate token (My Account → Security), and add to Jenkins as credential `sonarqube-token`.

5. **Update the Jenkinsfile** with the App EC2 IP:
   ```groovy
   APP_EC2_HOST = '<YOUR_APP_EIP>'
   ```

---

## Approximate monthly cost (Mumbai region)

| Item | Hourly | Monthly |
|------|--------|---------|
| 3× `t3.medium` | ~$0.0464 each | ~$100 |
| 3× 30 GB gp3 EBS | — | ~$8 |
| 1× Elastic IP (in use) | $0 | $0 |
| Data transfer | varies | ~$5 |
| **Total** | | **~$110–120/month** |

To save cost while learning: drop Jenkins/SonarQube to `t3.small` (note: SonarQube needs ≥3GB RAM, so `t3.small` will OOM — keep it on `t3.medium`).

---

## Tear down

```bash
terraform destroy
```

⚠️ This permanently deletes all 3 instances and their data. Take a snapshot first if needed.
