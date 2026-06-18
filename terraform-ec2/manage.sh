#!/usr/bin/env bash
###############################################################################
# manage.sh — Start / Stop / Status the 3 DevSync EC2 instances
#
# Usage:
#   ./manage.sh start    # boot all 3 instances (~$0.06/hour while running)
#   ./manage.sh stop     # stop all 3 (storage-only ~$0.05/day while stopped)
#   ./manage.sh status   # show current state + public IPs
#   ./manage.sh ips      # just print current public IPs
#
# IMPORTANT: when stopped, public IPs CHANGE on next start (unless EIP is set).
# After ./manage.sh start, run ./manage.sh ips to get the new IPs.
###############################################################################
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v aws >/dev/null 2>&1; then
  echo "ERROR: aws CLI not installed."
  exit 1
fi

if ! command -v terraform >/dev/null 2>&1; then
  echo "ERROR: terraform not installed."
  exit 1
fi

# Pull instance IDs from terraform output
JENKINS_ID=$(terraform output -json instance_ids | python3 -c "import sys,json;print(json.load(sys.stdin)['jenkins'])")
SONAR_ID=$(terraform output -json instance_ids | python3 -c "import sys,json;print(json.load(sys.stdin)['sonarqube'])")
APP_ID=$(terraform output -json instance_ids | python3 -c "import sys,json;print(json.load(sys.stdin)['app'])")
REGION=$(terraform output -raw aws_region 2>/dev/null || echo "ap-south-1")

ALL_IDS=("$JENKINS_ID" "$SONAR_ID" "$APP_ID")

case "${1:-}" in
  start)
    echo "Starting all 3 instances..."
    aws ec2 start-instances --region "$REGION" --instance-ids "${ALL_IDS[@]}" >/dev/null
    aws ec2 wait instance-running --region "$REGION" --instance-ids "${ALL_IDS[@]}"
    echo "All instances running. Fetching new IPs..."
    "$0" ips
    echo ""
    echo "NOTE: Wait ~30s for SSH to be ready. SonarQube takes ~2 min to be available on :9000."
    ;;

  stop)
    echo "Stopping all 3 instances (storage stays, charges drop ~95%)..."
    aws ec2 stop-instances --region "$REGION" --instance-ids "${ALL_IDS[@]}" >/dev/null
    aws ec2 wait instance-stopped --region "$REGION" --instance-ids "${ALL_IDS[@]}"
    echo "All instances stopped."
    ;;

  status)
    aws ec2 describe-instances \
      --region "$REGION" \
      --instance-ids "${ALL_IDS[@]}" \
      --query 'Reservations[].Instances[].[Tags[?Key==`Name`]|[0].Value, State.Name, PublicIpAddress, InstanceType]' \
      --output table
    ;;

  ips)
    echo ""
    aws ec2 describe-instances \
      --region "$REGION" \
      --instance-ids "${ALL_IDS[@]}" \
      --query 'Reservations[].Instances[].[Tags[?Key==`Name`]|[0].Value, PublicIpAddress]' \
      --output table
    echo ""
    echo "Jenkins URL:   http://$(aws ec2 describe-instances --region $REGION --instance-ids $JENKINS_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text):8080"
    echo "SonarQube URL: http://$(aws ec2 describe-instances --region $REGION --instance-ids $SONAR_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text):9000"
    echo "App URL:       http://$(aws ec2 describe-instances --region $REGION --instance-ids $APP_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)"
    ;;

  *)
    echo "Usage: $0 {start|stop|status|ips}"
    exit 1
    ;;
esac
