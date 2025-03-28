.PHONY: build run test clean

# Build settings
APP_NAME=pipelineiq
BUILD_DIR=./bin

# Go settings
GO=go
GO_BUILD=$(GO) build
GO_TEST=$(GO) test
GO_CLEAN=$(GO) clean
GO_GET=$(GO) get

# Build the application
build:
	@echo "Building $(APP_NAME)..."
	@mkdir -p $(BUILD_DIR)
	$(GO_BUILD) -o $(BUILD_DIR)/$(APP_NAME) ./cmd/app

# Run the application
run:
	@echo "Running $(APP_NAME)..."
	$(GO) run ./cmd/app/main.go

# Run tests
test:
	@echo "Running tests..."
	$(GO_TEST) ./...

# Run tests with verbose output
test-verbose:
	@echo "Running tests with verbose output..."
	$(GO_TEST) -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	$(GO_TEST) -cover ./...

# Get dependencies
deps:
	@echo "Updating dependencies..."
	$(GO_GET) -u ./...

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf $(BUILD_DIR)
	$(GO_CLEAN) ./...