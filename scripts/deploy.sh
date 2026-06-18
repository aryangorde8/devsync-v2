#!/bin/bash
# =============================================================================
# DevSync - Deployment Script
# =============================================================================
# Deploys the application to Kubernetes cluster
# Usage: ./scripts/deploy.sh [environment] [version]
# Example: ./scripts/deploy.sh prod v1.0.0
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="${1:-staging}"
VERSION="${2:-latest}"
NAMESPACE="devsync"
TIMEOUT="300s"

# Configuration
BACKEND_IMAGE="ghcr.io/aryangorde8/devsync-backend"
FRONTEND_IMAGE="ghcr.io/aryangorde8/devsync-frontend"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Update kubeconfig
configure_cluster() {
    log_info "Configuring cluster access..."
    
    case $ENVIRONMENT in
        prod|production)
            CLUSTER_NAME="devsync"
            AWS_REGION="us-east-1"
            ;;
        staging)
            CLUSTER_NAME="devsync-staging"
            AWS_REGION="us-east-1"
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION"
    log_success "Cluster configured: $CLUSTER_NAME"
}

# Pre-deployment checks
pre_deploy_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_info "Creating namespace $NAMESPACE..."
        kubectl create namespace "$NAMESPACE"
    fi
    
    # Check current deployment status
    if kubectl get deployment devsync-backend -n "$NAMESPACE" &> /dev/null; then
        CURRENT_REPLICAS=$(kubectl get deployment devsync-backend -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
        log_info "Current backend replicas: ${CURRENT_REPLICAS:-0}"
    fi
    
    log_success "Pre-deployment checks passed"
}

# Deploy application
deploy() {
    log_info "Deploying DevSync $VERSION to $ENVIRONMENT..."
    
    # Apply Kubernetes manifests
    log_info "Applying Kubernetes manifests..."
    kubectl apply -k k8s/
    
    # Update images
    log_info "Updating backend image to $BACKEND_IMAGE:$VERSION..."
    kubectl set image deployment/devsync-backend \
        backend="$BACKEND_IMAGE:$VERSION" \
        -n "$NAMESPACE"
    
    log_info "Updating frontend image to $FRONTEND_IMAGE:$VERSION..."
    kubectl set image deployment/devsync-frontend \
        frontend="$FRONTEND_IMAGE:$VERSION" \
        -n "$NAMESPACE"
    
    # Wait for rollout
    log_info "Waiting for backend rollout..."
    kubectl rollout status deployment/devsync-backend -n "$NAMESPACE" --timeout="$TIMEOUT"
    
    log_info "Waiting for frontend rollout..."
    kubectl rollout status deployment/devsync-frontend -n "$NAMESPACE" --timeout="$TIMEOUT"
    
    log_success "Deployment completed successfully!"
}

# Post-deployment validation
validate_deployment() {
    log_info "Validating deployment..."
    
    # Check pods
    log_info "Pod status:"
    kubectl get pods -n "$NAMESPACE" -l app=devsync
    
    # Health check
    log_info "Running health check..."
    BACKEND_POD=$(kubectl get pods -n "$NAMESPACE" -l component=backend -o jsonpath='{.items[0].metadata.name}')
    
    if kubectl exec "$BACKEND_POD" -n "$NAMESPACE" -- curl -s http://localhost:8000/api/v1/core/health/ | grep -q "healthy"; then
        log_success "Backend health check passed"
    else
        log_warning "Backend health check failed"
    fi
    
    # Show services
    log_info "Services:"
    kubectl get services -n "$NAMESPACE"
    
    # Show ingress
    log_info "Ingress:"
    kubectl get ingress -n "$NAMESPACE"
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    kubectl rollout undo deployment/devsync-backend -n "$NAMESPACE"
    kubectl rollout undo deployment/devsync-frontend -n "$NAMESPACE"
    
    log_info "Waiting for rollback to complete..."
    kubectl rollout status deployment/devsync-backend -n "$NAMESPACE" --timeout="$TIMEOUT"
    kubectl rollout status deployment/devsync-frontend -n "$NAMESPACE" --timeout="$TIMEOUT"
    
    log_success "Rollback completed"
}

# Main execution
main() {
    echo "================================================="
    echo "  DevSync Deployment Script"
    echo "  Environment: $ENVIRONMENT"
    echo "  Version: $VERSION"
    echo "================================================="
    
    check_prerequisites
    configure_cluster
    pre_deploy_checks
    
    # Deploy with error handling
    if deploy; then
        validate_deployment
        log_success "Deployment to $ENVIRONMENT completed successfully!"
    else
        log_error "Deployment failed!"
        read -p "Do you want to rollback? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback
        fi
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --rollback)
        check_prerequisites
        configure_cluster
        rollback
        ;;
    --status)
        check_prerequisites
        configure_cluster
        kubectl get all -n "$NAMESPACE"
        ;;
    --help|-h)
        echo "Usage: $0 [environment] [version]"
        echo ""
        echo "Arguments:"
        echo "  environment    Target environment (staging, prod)"
        echo "  version        Image version/tag (default: latest)"
        echo ""
        echo "Options:"
        echo "  --rollback     Rollback to previous deployment"
        echo "  --status       Show current deployment status"
        echo "  --help, -h     Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 staging latest"
        echo "  $0 prod v1.0.0"
        echo "  $0 --rollback"
        ;;
    *)
        main
        ;;
esac
