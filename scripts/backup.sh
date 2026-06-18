#!/bin/bash
# =============================================================================
# DevSync - Database Backup Script
# =============================================================================
# Creates backups of PostgreSQL database
# Usage: ./scripts/backup.sh [local|s3]
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="${S3_BUCKET:-devsync-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Local PostgreSQL backup
backup_local() {
    log_info "Creating local database backup..."
    
    BACKUP_FILE="${BACKUP_DIR}/devsync_${TIMESTAMP}.sql.gz"
    
    # Check if running in Docker
    if [ -f /.dockerenv ]; then
        pg_dump -h postgres -U devsync devsync | gzip > "$BACKUP_FILE"
    else
        # Local development
        source .env 2>/dev/null || true
        PGPASSWORD="${DB_PASSWORD:-devsync}" pg_dump \
            -h "${DB_HOST:-localhost}" \
            -U "${DB_USER:-devsync}" \
            "${DB_NAME:-devsync}" | gzip > "$BACKUP_FILE"
    fi
    
    log_success "Backup created: $BACKUP_FILE"
    ls -lh "$BACKUP_FILE"
}

# Kubernetes backup
backup_kubernetes() {
    log_info "Creating backup from Kubernetes..."
    
    NAMESPACE="${NAMESPACE:-devsync}"
    BACKUP_FILE="${BACKUP_DIR}/devsync_k8s_${TIMESTAMP}.sql.gz"
    
    # Get database pod
    DB_POD=$(kubectl get pods -n "$NAMESPACE" -l component=database -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$DB_POD" ]; then
        log_error "Database pod not found"
        exit 1
    fi
    
    log_info "Found database pod: $DB_POD"
    
    # Create backup
    kubectl exec "$DB_POD" -n "$NAMESPACE" -- \
        pg_dump -U devsync devsync | gzip > "$BACKUP_FILE"
    
    log_success "Kubernetes backup created: $BACKUP_FILE"
    ls -lh "$BACKUP_FILE"
}

# Upload to S3
upload_to_s3() {
    local backup_file="$1"
    
    log_info "Uploading backup to S3..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not installed"
        return 1
    fi
    
    aws s3 cp "$backup_file" "s3://${S3_BUCKET}/backups/$(basename "$backup_file")"
    
    log_success "Backup uploaded to S3"
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Local cleanup
    find "$BACKUP_DIR" -name "devsync_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
    
    # S3 cleanup (if configured)
    if command -v aws &> /dev/null; then
        aws s3 ls "s3://${S3_BUCKET}/backups/" | while read -r line; do
            file_date=$(echo "$line" | awk '{print $1}')
            file_name=$(echo "$line" | awk '{print $4}')
            
            if [ -n "$file_name" ]; then
                file_age=$(( ($(date +%s) - $(date -d "$file_date" +%s)) / 86400 ))
                if [ "$file_age" -gt "$RETENTION_DAYS" ]; then
                    aws s3 rm "s3://${S3_BUCKET}/backups/$file_name"
                    log_info "Deleted old backup: $file_name"
                fi
            fi
        done 2>/dev/null || true
    fi
    
    log_success "Cleanup completed"
}

# Restore from backup
restore_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_info "Restoring from backup: $backup_file"
    
    read -p "This will overwrite the current database. Are you sure? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    source .env 2>/dev/null || true
    
    gunzip -c "$backup_file" | PGPASSWORD="${DB_PASSWORD:-devsync}" psql \
        -h "${DB_HOST:-localhost}" \
        -U "${DB_USER:-devsync}" \
        "${DB_NAME:-devsync}"
    
    log_success "Database restored successfully"
}

# List backups
list_backups() {
    log_info "Local backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No local backups found"
    
    echo ""
    log_info "S3 backups:"
    aws s3 ls "s3://${S3_BUCKET}/backups/" 2>/dev/null || echo "No S3 backups or bucket not accessible"
}

# Show help
show_help() {
    echo "DevSync Database Backup Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  local        Create local backup"
    echo "  k8s          Create backup from Kubernetes"
    echo "  s3           Create local backup and upload to S3"
    echo "  restore      Restore from backup file"
    echo "  list         List available backups"
    echo "  cleanup      Remove old backups"
    echo ""
    echo "Options:"
    echo "  --help, -h   Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  BACKUP_DIR      Local backup directory (default: ./backups)"
    echo "  S3_BUCKET       S3 bucket name (default: devsync-backups)"
    echo "  RETENTION_DAYS  Days to keep backups (default: 7)"
    echo ""
    echo "Examples:"
    echo "  $0 local"
    echo "  $0 s3"
    echo "  $0 restore ./backups/devsync_20240101_120000.sql.gz"
}

# Main
case "${1:-local}" in
    local)
        backup_local
        cleanup_old_backups
        ;;
    k8s|kubernetes)
        backup_kubernetes
        cleanup_old_backups
        ;;
    s3)
        backup_local
        upload_to_s3 "${BACKUP_DIR}/devsync_${TIMESTAMP}.sql.gz"
        cleanup_old_backups
        ;;
    restore)
        restore_backup "${2:-}"
        ;;
    list)
        list_backups
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    --help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
