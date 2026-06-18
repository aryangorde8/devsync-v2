#!/bin/bash
# =============================================================================
# DevSync - Setup Script
# =============================================================================
# Initial setup script for local development environment
# Usage: ./scripts/setup.sh
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step() { echo -e "${CYAN}==>${NC} $1"; }

# Banner
echo -e "${CYAN}"
echo "================================================="
echo "   ____             ____                   "
echo "  |  _ \  _____   _/ ___| _   _ _ __   ___ "
echo "  | | | |/ _ \ \ / /\___ \| | | | '_ \ / __|"
echo "  | |_| |  __/\ V /  ___) | |_| | | | | (__ "
echo "  |____/ \___| \_/  |____/ \__, |_| |_|\___|"
echo "                           |___/            "
echo "================================================="
echo -e "${NC}"
echo "  Developer Portfolio Dashboard - Setup Script"
echo ""

# Check OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    log_info "Detected OS: $OS"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    local missing=()
    
    # Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        log_success "Python $PYTHON_VERSION"
    else
        missing+=("python3")
    fi
    
    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js $NODE_VERSION"
    else
        missing+=("node")
    fi
    
    # npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        log_success "npm $NPM_VERSION"
    else
        missing+=("npm")
    fi
    
    # Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | cut -d' ' -f3)
        log_success "Git $GIT_VERSION"
    else
        missing+=("git")
    fi
    
    # Docker (optional)
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
        log_success "Docker $DOCKER_VERSION"
    else
        log_warning "Docker not found (optional)"
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing[*]}"
        echo ""
        echo "Please install the missing tools and run this script again."
        exit 1
    fi
}

# Create virtual environment
setup_python_env() {
    log_step "Setting up Python environment..."
    
    VENV_PATH="${VENV_PATH:-.venv}"
    
    if [ ! -d "$VENV_PATH" ]; then
        log_info "Creating virtual environment..."
        python3 -m venv "$VENV_PATH"
    else
        log_info "Virtual environment already exists"
    fi
    
    # Activate venv
    source "$VENV_PATH/bin/activate"
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install requirements
    log_info "Installing Python dependencies..."
    pip install -r backend/requirements.txt
    
    log_success "Python environment ready"
}

# Setup Node.js environment
setup_node_env() {
    log_step "Setting up Node.js environment..."
    
    cd frontend
    
    log_info "Installing Node.js dependencies..."
    npm install
    
    cd ..
    
    log_success "Node.js environment ready"
}

# Setup environment files
setup_env_files() {
    log_step "Setting up environment files..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            log_info "Created backend/.env from example"
        else
            cat > backend/.env << 'EOF'
# Django settings
DJANGO_SECRET_KEY=your-secret-key-change-in-production
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3

# Redis (optional)
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ALLOW_ALL_ORIGINS=True
EOF
            log_info "Created backend/.env"
        fi
    else
        log_info "backend/.env already exists"
    fi
    
    # Frontend .env.local
    if [ ! -f "frontend/.env.local" ]; then
        cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
EOF
        log_info "Created frontend/.env.local"
    else
        log_info "frontend/.env.local already exists"
    fi
    
    log_success "Environment files ready"
}

# Initialize database
setup_database() {
    log_step "Setting up database..."
    
    source "$VENV_PATH/bin/activate"
    cd backend
    
    log_info "Running migrations..."
    python manage.py migrate
    
    log_info "Collecting static files..."
    python manage.py collectstatic --noinput
    
    cd ..
    
    log_success "Database ready"
}

# Create superuser
create_superuser() {
    log_step "Creating admin user..."
    
    read -p "Create superuser? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        source "$VENV_PATH/bin/activate"
        cd backend
        python manage.py createsuperuser
        cd ..
    else
        log_info "Skipping superuser creation"
    fi
}

# Setup Git hooks
setup_git_hooks() {
    log_step "Setting up Git hooks..."
    
    # Pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for DevSync

echo "Running pre-commit checks..."

# Backend checks
echo "Checking Python code..."
cd backend
black --check . 2>/dev/null || echo "Run 'black .' to format Python code"
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics 2>/dev/null
cd ..

# Frontend checks
echo "Checking TypeScript code..."
cd frontend
npm run lint 2>/dev/null || echo "Run 'npm run lint' to check frontend code"
cd ..

echo "Pre-commit checks complete"
EOF
    
    chmod +x .git/hooks/pre-commit
    
    log_success "Git hooks configured"
}

# Print summary
print_summary() {
    echo ""
    echo -e "${GREEN}=================================================${NC}"
    echo -e "${GREEN}  Setup Complete!${NC}"
    echo -e "${GREEN}=================================================${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. Start the backend server:"
    echo -e "     ${CYAN}cd backend && python manage.py runserver${NC}"
    echo ""
    echo "  2. Start the frontend server (in a new terminal):"
    echo -e "     ${CYAN}cd frontend && npm run dev${NC}"
    echo ""
    echo "  3. Open in browser:"
    echo -e "     Frontend: ${CYAN}http://localhost:3000${NC}"
    echo -e "     Backend:  ${CYAN}http://localhost:8000${NC}"
    echo -e "     Admin:    ${CYAN}http://localhost:8000/admin${NC}"
    echo ""
    echo "  Or use Docker:"
    echo -e "     ${CYAN}docker-compose up${NC}"
    echo ""
    echo "Documentation: README.md"
    echo ""
}

# Main execution
main() {
    detect_os
    check_prerequisites
    setup_python_env
    setup_node_env
    setup_env_files
    setup_database
    create_superuser
    setup_git_hooks
    print_summary
}

# Run
main
