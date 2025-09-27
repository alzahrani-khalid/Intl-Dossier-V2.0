#!/bin/bash

# GASTAT International Dossier System - Development Environment Setup
# This script sets up the complete development environment

set -e

echo "🚀 Setting up GASTAT International Dossier Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_success "Docker is running"
}

# Check if required tools are installed
check_requirements() {
    log_info "Checking requirements..."

    # Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 20+ and try again."
        exit 1
    fi

    NODE_VERSION=$(node --version | sed 's/v//')
    log_success "Node.js $NODE_VERSION installed"

    # npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi

    NPM_VERSION=$(npm --version)
    log_success "npm $NPM_VERSION installed"

    # Docker
    check_docker
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."

    # Root dependencies
    npm install
    log_success "Root dependencies installed"

    # Backend dependencies
    cd backend && npm install && cd ..
    log_success "Backend dependencies installed"

    # Frontend dependencies
    cd frontend && npm install && cd ..
    log_success "Frontend dependencies installed"
}

# Setup environment files
setup_environment() {
    log_info "Setting up environment files..."

    # Create .env from .env.example if it doesn't exist
    if [ ! -f .env ]; then
        cp .env.example .env
        log_success "Created .env from .env.example"
        log_warning "Please update .env with your actual configuration values"
    else
        log_info ".env file already exists, skipping"
    fi
}

# Setup database
setup_database() {
    log_info "Setting up database..."

    # Start PostgreSQL with Docker
    docker-compose up -d postgres redis
    log_success "Database containers started"

    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10

    # Run migrations
    npm run db:migrate
    log_success "Database migrations completed"
}

# Setup monitoring (optional)
setup_monitoring() {
    read -p "Do you want to set up monitoring stack (Prometheus/Grafana)? [y/N]: " setup_monitor

    if [[ $setup_monitor =~ ^[Yy]$ ]]; then
        log_info "Setting up monitoring stack..."
        docker-compose up -d prometheus grafana
        log_success "Monitoring stack started"
        log_info "Grafana: http://localhost:3003 (admin/admin)"
        log_info "Prometheus: http://localhost:9090"
    fi
}

# Run initial tests
run_tests() {
    read -p "Do you want to run initial tests? [y/N]: " run_test

    if [[ $run_test =~ ^[Yy]$ ]]; then
        log_info "Running tests..."
        npm run test
        log_success "Tests completed"
    fi
}

# Main setup process
main() {
    echo "🏢 GASTAT International Dossier System"
    echo "📋 Development Environment Setup"
    echo "================================="

    check_requirements
    install_dependencies
    setup_environment
    setup_database
    setup_monitoring
    run_tests

    echo ""
    log_success "🎉 Development environment setup complete!"
    echo ""
    echo "📚 Next steps:"
    echo "  1. Update your .env file with proper configuration"
    echo "  2. Start the development servers: npm run dev"
    echo "  3. Visit the application:"
    echo "     - Frontend: http://localhost:3000"
    echo "     - Backend API: http://localhost:3001"
    echo "     - AnythingLLM: http://localhost:3002"
    echo ""
    echo "🔧 Useful commands:"
    echo "  - npm run dev        # Start all services"
    echo "  - npm run docker:up  # Start Docker services"
    echo "  - npm run db:setup   # Setup database"
    echo "  - npm run test       # Run tests"
    echo ""
    log_info "Happy coding! 🚀"
}

# Run main function
main "$@"