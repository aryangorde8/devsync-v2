# =============================================================================
# DevSync - Makefile
# =============================================================================
# Professional development workflow automation
# Usage: make [command]
# =============================================================================

.PHONY: help install run test lint format migrate shell clean docker-up docker-down docker-build docker-logs

# Default target
help:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║              DevSync - Development Commands                ║"
	@echo "╚════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Local Development:"
	@echo "  make install     - Install dependencies"
	@echo "  make run         - Start development server"
	@echo "  make test        - Run test suite"
	@echo "  make lint        - Run linters (flake8, black)"
	@echo "  make format      - Format code with black"
	@echo "  make migrate     - Run database migrations"
	@echo "  make shell       - Open Django shell"
	@echo "  make superuser   - Create superuser"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-up   - Start all containers"
	@echo "  make docker-down - Stop all containers"
	@echo "  make docker-build - Rebuild containers"
	@echo "  make docker-logs - View container logs"
	@echo "  make docker-shell - Shell into backend container"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean       - Remove cache and temp files"
	@echo ""

# =============================================================================
# Local Development
# =============================================================================

install:
	@echo "📦 Installing dependencies..."
	cd backend && python3 -m venv venv && \
		. venv/bin/activate && \
		pip install --upgrade pip && \
		pip install -r requirements.txt
	@echo "✅ Installation complete!"

run:
	@echo "🚀 Starting development server..."
	cd backend && . venv/bin/activate && python manage.py runserver

test:
	@echo "🧪 Running tests..."
	cd backend && . venv/bin/activate && pytest -v --tb=short

test-cov:
	@echo "🧪 Running tests with coverage..."
	cd backend && . venv/bin/activate && pytest --cov=. --cov-report=html --cov-report=term

lint:
	@echo "🔍 Running linters..."
	cd backend && . venv/bin/activate && flake8 . && black --check .

format:
	@echo "✨ Formatting code..."
	cd backend && . venv/bin/activate && black . && isort .

migrate:
	@echo "🗃️ Running migrations..."
	cd backend && . venv/bin/activate && python manage.py makemigrations && python manage.py migrate

shell:
	@echo "🐚 Opening Django shell..."
	cd backend && . venv/bin/activate && python manage.py shell

superuser:
	@echo "👤 Creating superuser..."
	cd backend && . venv/bin/activate && python manage.py createsuperuser

# =============================================================================
# Docker Commands
# =============================================================================

docker-up:
	@echo "🐳 Starting Docker containers..."
	cp .env.docker .env 2>/dev/null || true
	docker compose up -d
	@echo "✅ Containers started!"
	@echo "   API: http://localhost:8000/api/v1/"
	@echo "   Docs: http://localhost:8000/api/docs/"

docker-down:
	@echo "🛑 Stopping Docker containers..."
	docker compose down
	@echo "✅ Containers stopped!"

docker-build:
	@echo "🔨 Rebuilding Docker containers..."
	docker compose up -d --build
	@echo "✅ Rebuild complete!"

docker-logs:
	@echo "📋 Viewing logs..."
	docker compose logs -f

docker-shell:
	@echo "🐚 Opening shell in backend container..."
	docker compose exec backend bash

docker-migrate:
	@echo "🗃️ Running migrations in Docker..."
	docker compose exec backend python manage.py migrate

docker-test:
	@echo "🧪 Running tests in Docker..."
	docker compose exec backend pytest -v

# =============================================================================
# Cleanup
# =============================================================================

clean:
	@echo "🧹 Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	rm -rf backend/htmlcov 2>/dev/null || true
	rm -rf backend/.pytest_cache 2>/dev/null || true
	@echo "✅ Cleanup complete!"

docker-clean:
	@echo "🧹 Cleaning Docker resources..."
	docker compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ Docker cleanup complete!"
