.PHONY: build run test clean frontend-build frontend-dev docker-up docker-down lint

# Build settings
APP_NAME=pipelineiq
BUILD_DIR=./bin

# Go settings
GO=go
GO_BUILD=$(GO) build
GO_TEST=$(GO) test
GO_CLEAN=$(GO) clean
GO_GET=$(GO) get
GO_LINT=golangci-lint run

# NPM settings
NPM=cd frontend && npm

# Docker settings
DOCKER_COMPOSE=docker-compose

# Build backend application
build:
	@echo "Building backend $(APP_NAME)..."
	@mkdir -p $(BUILD_DIR)
	$(GO_BUILD) -o $(BUILD_DIR)/$(APP_NAME) ./cmd/app

# Run backend application
run:
	@echo "Running backend $(APP_NAME)..."
	$(GO) run ./cmd/app/main.go

# Run Go tests
test:
	@echo "Running backend tests..."
	$(GO_TEST) ./...

# Run tests with verbose output
test-verbose:
	@echo "Running backend tests with verbose output..."
	$(GO_TEST) -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running backend tests with coverage..."
	$(GO_TEST) -cover ./...
	@echo "Coverage report saved to coverage.out"

# Get backend dependencies
deps:
	@echo "Updating backend dependencies..."
	$(GO_GET) -u ./...

# Clean build artifacts
clean:
	@echo "Cleaning backend artifacts..."
	@rm -rf $(BUILD_DIR)
	$(GO_CLEAN) ./...
	@echo "Cleaning frontend artifacts..."
	@rm -rf frontend/dist

# Build frontend
frontend-build:
	@echo "Building frontend..."
	$(NPM) run build

# Run frontend development server
frontend-dev:
	@echo "Starting frontend development server..."
	$(NPM) run dev

# Install frontend dependencies
frontend-deps:
	@echo "Installing frontend dependencies..."
	$(NPM) install

# Lint code
lint:
	@echo "Linting backend code..."
	$(GO_LINT)
	@echo "Linting frontend code..."
	$(NPM) run lint

# Start docker containers
docker-up:
	@echo "Starting Docker containers..."
	$(DOCKER_COMPOSE) up --build -d
	@echo "Services available at:"
	@echo "  - Frontend: http://localhost"
	@echo "  - Backend API: http://localhost:8080"

# Stop docker containers
docker-down:
	@echo "Stopping Docker containers..."
	$(DOCKER_COMPOSE) down

# Build both frontend and backend
build-all: build frontend-build
	@echo "Both frontend and backend built successfully"

# Run development setup (frontend dev server + backend)
dev: 
	@echo "Starting development environment..."
	@echo "Starting backend..."
	$(GO) run ./cmd/app/main.go & echo $$! > backend.pid
	@echo "Starting frontend..."
	$(NPM) run dev

# Stop development setup
dev-stop:
	@echo "Stopping development environment..."
	@if [ -f backend.pid ]; then kill $$(cat backend.pid) && rm backend.pid || true; fi

# Full application update and rebuild
update: deps frontend-deps build-all docker-up
	@echo "Application fully updated and rebuilt"