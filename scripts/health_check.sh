#!/bin/bash
# =============================================================================
# DevSync - Health Check Script
# =============================================================================
# Monitors application health and sends alerts
# Usage: ./scripts/health_check.sh [local|k8s|prod]
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${1:-local}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
MAX_RETRIES=3
RETRY_DELAY=5

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# Send Slack notification
send_slack_alert() {
    local message="$1"
    local status="${2:-warning}"
    
    if [ -z "$SLACK_WEBHOOK" ]; then
        return 0
    fi
    
    local color
    case $status in
        success) color="good" ;;
        warning) color="warning" ;;
        error) color="danger" ;;
        *) color="warning" ;;
    esac
    
    curl -s -X POST "$SLACK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d "{
            \"attachments\": [{
                \"color\": \"$color\",
                \"title\": \"DevSync Health Check\",
                \"text\": \"$message\",
                \"footer\": \"Environment: $ENVIRONMENT\",
                \"ts\": $(date +%s)
            }]
        }" > /dev/null
}

# HTTP health check with retries
check_http() {
    local url="$1"
    local name="$2"
    local expected="${3:-200}"
    
    for i in $(seq 1 $MAX_RETRIES); do
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
        
        if [ "$response" = "$expected" ]; then
            log_success "$name - HTTP $response"
            return 0
        fi
        
        if [ $i -lt $MAX_RETRIES ]; then
            log_warning "$name - HTTP $response (retry $i/$MAX_RETRIES)"
            sleep $RETRY_DELAY
        fi
    done
    
    log_error "$name - HTTP $response (expected $expected)"
    return 1
}

# Check JSON health endpoint
check_health_endpoint() {
    local url="$1"
    local name="$2"
    
    response=$(curl -s --max-time 10 "$url" 2>/dev/null || echo '{"status":"error"}')
    status=$(echo "$response" | jq -r '.status // "error"' 2>/dev/null || echo "error")
    
    if [ "$status" = "healthy" ]; then
        log_success "$name - Status: $status"
        return 0
    else
        log_error "$name - Status: $status"
        echo "  Response: $response"
        return 1
    fi
}

# Check database connectivity
check_database() {
    log_info "Checking database..."
    
    case $ENVIRONMENT in
        local)
            if PGPASSWORD="${DB_PASSWORD:-devsync}" psql -h "${DB_HOST:-localhost}" -U "${DB_USER:-devsync}" -d "${DB_NAME:-devsync}" -c "SELECT 1" &>/dev/null; then
                log_success "Database - Connected"
                return 0
            fi
            ;;
        k8s)
            local db_pod=$(kubectl get pods -n devsync -l component=database -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
            if [ -n "$db_pod" ]; then
                if kubectl exec "$db_pod" -n devsync -- pg_isready -U devsync &>/dev/null; then
                    log_success "Database - Connected"
                    return 0
                fi
            fi
            ;;
    esac
    
    log_error "Database - Connection failed"
    return 1
}

# Check Redis connectivity
check_redis() {
    log_info "Checking Redis..."
    
    case $ENVIRONMENT in
        local)
            if redis-cli -h "${REDIS_HOST:-localhost}" ping &>/dev/null; then
                log_success "Redis - Connected"
                return 0
            fi
            ;;
        k8s)
            local redis_pod=$(kubectl get pods -n devsync -l component=cache -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
            if [ -n "$redis_pod" ]; then
                if kubectl exec "$redis_pod" -n devsync -- redis-cli ping &>/dev/null; then
                    log_success "Redis - Connected"
                    return 0
                fi
            fi
            ;;
    esac
    
    log_warning "Redis - Connection failed (non-critical)"
    return 0  # Redis is optional
}

# Check Kubernetes pods
check_k8s_pods() {
    log_info "Checking Kubernetes pods..."
    
    local unhealthy=0
    
    # Check backend pods
    backend_ready=$(kubectl get pods -n devsync -l component=backend -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)
    backend_count=$(echo "$backend_ready" | wc -w)
    backend_healthy=$(echo "$backend_ready" | grep -o "True" | wc -l)
    
    if [ "$backend_healthy" -ge 1 ]; then
        log_success "Backend pods - $backend_healthy/$backend_count ready"
    else
        log_error "Backend pods - $backend_healthy/$backend_count ready"
        unhealthy=1
    fi
    
    # Check frontend pods
    frontend_ready=$(kubectl get pods -n devsync -l component=frontend -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)
    frontend_count=$(echo "$frontend_ready" | wc -w)
    frontend_healthy=$(echo "$frontend_ready" | grep -o "True" | wc -l)
    
    if [ "$frontend_healthy" -ge 1 ]; then
        log_success "Frontend pods - $frontend_healthy/$frontend_count ready"
    else
        log_error "Frontend pods - $frontend_healthy/$frontend_count ready"
        unhealthy=1
    fi
    
    return $unhealthy
}

# Check disk space
check_disk_space() {
    log_info "Checking disk space..."
    
    local threshold=80
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt "$threshold" ]; then
        log_success "Disk space - ${usage}% used"
    else
        log_warning "Disk space - ${usage}% used (threshold: ${threshold}%)"
    fi
}

# Check memory usage
check_memory() {
    log_info "Checking memory..."
    
    local threshold=80
    local usage=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
    
    if [ "$usage" -lt "$threshold" ]; then
        log_success "Memory - ${usage}% used"
    else
        log_warning "Memory - ${usage}% used (threshold: ${threshold}%)"
    fi
}

# Main health check
run_health_check() {
    echo "================================================="
    echo "  DevSync Health Check"
    echo "  Environment: $ENVIRONMENT"
    echo "  Time: $(date)"
    echo "================================================="
    echo ""
    
    local failed=0
    
    case $ENVIRONMENT in
        local)
            check_http "http://localhost:8000/api/v1/health/" "Backend API" || failed=1
            check_http "http://localhost:3000/" "Frontend" || failed=1
            check_database || failed=1
            check_redis
            check_disk_space
            check_memory
            ;;
        k8s)
            check_k8s_pods || failed=1
            check_database || failed=1
            check_redis
            ;;
        prod|production)
            check_health_endpoint "https://api.devsync.io/api/v1/health/" "Backend API" || failed=1
            check_http "https://devsync.io/" "Frontend" || failed=1
            check_http "https://api.devsync.io/api/v1/metrics/" "Metrics endpoint" || failed=1
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    echo ""
    echo "================================================="
    
    if [ $failed -eq 0 ]; then
        log_success "All health checks passed!"
        send_slack_alert "All health checks passed ✅" "success"
        exit 0
    else
        log_error "Some health checks failed!"
        send_slack_alert "Health check failures detected ⚠️" "error"
        exit 1
    fi
}

# Show help
show_help() {
    echo "DevSync Health Check Script"
    echo ""
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  local      Check local development setup"
    echo "  k8s        Check Kubernetes deployment"
    echo "  prod       Check production deployment"
    echo ""
    echo "Environment variables:"
    echo "  SLACK_WEBHOOK    Slack webhook URL for alerts"
    echo ""
    echo "Examples:"
    echo "  $0 local"
    echo "  $0 prod"
    echo "  SLACK_WEBHOOK=https://hooks.slack.com/... $0 prod"
}

# Parse arguments
case "${1:-}" in
    --help|-h)
        show_help
        ;;
    *)
        run_health_check
        ;;
esac
