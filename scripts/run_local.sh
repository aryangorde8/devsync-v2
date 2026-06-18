#!/bin/bash
# =============================================================================
# DevSync - Local Development Script (FREE - No Docker Required)
# =============================================================================
# Usage: ./scripts/run_local.sh [command]
# Commands: setup, run, migrate, test, shell, clean
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
VENV_DIR="$BACKEND_DIR/venv"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      DevSync - Local Development       ║${NC}"
echo -e "${BLUE}║           FREE Tier Setup              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to activate virtual environment
activate_venv() {
    if [ -d "$VENV_DIR" ]; then
        source "$VENV_DIR/bin/activate"
    else
        echo -e "${RED}Virtual environment not found. Run './scripts/run_local.sh setup' first.${NC}"
        exit 1
    fi
}

# Setup command
setup() {
    echo -e "${YELLOW}Setting up DevSync (FREE tier)...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "$VENV_DIR" ]; then
        echo -e "${BLUE}Creating virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    # Activate and install dependencies
    source "$VENV_DIR/bin/activate"
    echo -e "${BLUE}Installing Python dependencies...${NC}"
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Copy environment file if it doesn't exist
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        echo -e "${BLUE}Creating .env file from template...${NC}"
        cp "$PROJECT_ROOT/.env.free" "$PROJECT_ROOT/.env"
    fi
    
    # Create necessary directories
    mkdir -p static media logs staticfiles
    
    # Run migrations
    echo -e "${BLUE}Running database migrations...${NC}"
    python manage.py migrate
    
    # Collect static files
    echo -e "${BLUE}Collecting static files...${NC}"
    python manage.py collectstatic --noinput
    
    echo ""
    echo -e "${GREEN}✅ Setup complete!${NC}"
    echo -e "${GREEN}Run './scripts/run_local.sh run' to start the server${NC}"
}

# Run development server
run() {
    echo -e "${YELLOW}Starting DevSync development server...${NC}"
    cd "$BACKEND_DIR"
    activate_venv
    
    echo ""
    echo -e "${GREEN}Server starting at:${NC}"
    echo -e "  • API:      ${BLUE}http://localhost:8000/api/v1/${NC}"
    echo -e "  • Admin:    ${BLUE}http://localhost:8000/admin/${NC}"
    echo -e "  • API Docs: ${BLUE}http://localhost:8000/api/docs/${NC}"
    echo ""
    
    python manage.py runserver
}

# Run migrations
migrate() {
    echo -e "${YELLOW}Running migrations...${NC}"
    cd "$BACKEND_DIR"
    activate_venv
    python manage.py makemigrations
    python manage.py migrate
    echo -e "${GREEN}✅ Migrations complete!${NC}"
}

# Run tests
run_tests() {
    echo -e "${YELLOW}Running tests...${NC}"
    cd "$BACKEND_DIR"
    activate_venv
    pytest -v --tb=short
}

# Open Django shell
shell() {
    echo -e "${YELLOW}Opening Django shell...${NC}"
    cd "$BACKEND_DIR"
    activate_venv
    python manage.py shell
}

# Create superuser
createsuperuser() {
    echo -e "${YELLOW}Creating superuser...${NC}"
    cd "$BACKEND_DIR"
    activate_venv
    python manage.py createsuperuser
}

# Clean up
clean() {
    echo -e "${YELLOW}Cleaning up...${NC}"
    cd "$BACKEND_DIR"
    
    # Remove Python cache
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    
    # Remove SQLite database (optional)
    read -p "Remove SQLite database? (y/N): " confirm
    if [[ $confirm == [yY] ]]; then
        rm -f db.sqlite3
        echo -e "${GREEN}Database removed.${NC}"
    fi
    
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
}

# Show help
show_help() {
    echo "Usage: ./scripts/run_local.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup          - Initial setup (create venv, install deps, migrate)"
    echo "  run            - Start the development server"
    echo "  migrate        - Run database migrations"
    echo "  test           - Run pytest tests"
    echo "  shell          - Open Django shell"
    echo "  createsuperuser - Create admin user"
    echo "  clean          - Clean up cache and temp files"
    echo "  help           - Show this help message"
}

# Main command handler
case "${1:-help}" in
    setup)
        setup
        ;;
    run)
        run
        ;;
    migrate)
        migrate
        ;;
    test)
        run_tests
        ;;
    shell)
        shell
        ;;
    createsuperuser)
        createsuperuser
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
