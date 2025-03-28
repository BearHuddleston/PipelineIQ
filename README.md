# PipelineIQ

A modern Go and TypeScript full-stack application that fetches data from public APIs, processes it, and leverages LLM technology to generate valuable insights.

## Project Overview

PipelineIQ is a comprehensive full-stack application that demonstrates a complete data pipeline:

1. **Data Ingestion**: Concurrently fetches data from multiple external APIs using Go's powerful concurrency model
2. **Data Processing**: Combines and transforms the raw data into meaningful insights with efficient processing algorithms
3. **LLM Analysis**: Uses advanced language models to generate human-readable analysis and extract key insights
4. **Interactive Dashboard**: Displays the processed data and insights in a modern React frontend with streaming capabilities

## Project Structure

```
PipelineIQ/
├── cmd/                      # Application entrypoints
│   └── app/                  # Main backend application
├── internal/                 # Backend internal packages
│   ├── api/                  # API handlers and routes
│   ├── config/               # Configuration management
│   ├── database/             # Database connection and migrations
│   ├── models/               # GORM data models
│   └── services/             # Business logic services
├── frontend/                 # React/TypeScript frontend
│   ├── src/                  # Frontend source code
│   │   ├── components/       # React components
│   │   ├── services/         # API client services
│   │   └── types/            # TypeScript type definitions
├── backend.Dockerfile        # Backend Docker build instructions
├── frontend.Dockerfile       # Frontend Docker build instructions
├── docker-compose.yml        # Docker Compose configuration
└── nginx.conf                # Nginx configuration for the frontend
```

## Prerequisites

- Docker and Docker Compose (for containerized deployment)
- Go 1.23 or higher (for local development)
- Node.js 18+ and npm/yarn (for local frontend development)
- PostgreSQL database (or use the containerized version)
- OpenAI API key for LLM functionality

## Environment Variables

Copy the example environment file and adjust as needed:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: API key for OpenAI (required for LLM analysis)
- `API_URL_1` and `API_URL_2`: URLs for the two data sources
- `WEATHER_API_KEY`: API key for weather data (if applicable)
- `PORT`: HTTP server port (defaults to 8080)

## Deployment with Docker

The easiest way to run the entire application stack is using Docker Compose:

```bash
# Build and start all services
docker-compose up --build
```

This will start:
- PostgreSQL database
- Go backend API
- React frontend served via Nginx

The application will be available at http://localhost

## Development

### Development with Make

PipelineIQ includes a comprehensive Makefile with commands for both backend and frontend development:

```bash
# Build the backend
make build

# Run the backend
make run

# Build the frontend
make frontend-build

# Run frontend dev server
make frontend-dev

# Install frontend dependencies
make frontend-deps

# Run backend tests
make test

# Build both frontend and backend
make build-all

# Start both backend and frontend for development
make dev

# Stop development environment
make dev-stop

# Start Docker containers
make docker-up

# Stop Docker containers
make docker-down

# Lint code (backend and frontend)
make lint

# Update dependencies and rebuild everything
make update

# Clean build artifacts
make clean
```

### Manual Backend Development

```bash
# Run the backend locally
go run cmd/app/main.go

# Run tests
go test ./...

# Build the backend
go build -o pipelineiq ./cmd/app
```

### Manual Frontend Development

```bash
# Install dependencies
cd frontend && npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## API Endpoints

### Health Check
- `GET /ping`: Server health check

### Data Pipeline
- `POST /fetch_and_process`: Trigger data ingestion, processing, and LLM analysis
  - Response: `{ "message": "Data pipeline completed successfully", "processed_id": 1, "analysis_id": 2, "completed_at": "2023-01-01T12:00:00Z" }`

### Data Retrieval
- `GET /results`: Get processed data
  - Optional query parameter: `date` (format: YYYY-MM-DD)
  - Response: `{ "results": [...], "count": 5 }`

- `GET /analysis`: Get LLM-generated insights
  - Optional query parameter: `id` (specific analysis ID)
  - Response: `{ "analysis": {...}, "generated_at": "2023-01-01T12:00:00Z" }`

- `GET /stream_analysis`: Stream LLM-generated insights (Server-Sent Events)
  - Optional query parameter: `processed_id` (specific processed data ID)
  - Response: Streaming events with types: start, content, error, complete

## Design Decisions

- **Concurrent Data Fetching**: Used Go's goroutines and channels for efficient parallel data retrieval
- **GORM ORM**: Simplified database operations with automatic migrations
- **Gin Web Framework**: Lightweight, high-performance HTTP router
- **React + TypeScript**: Type-safe frontend development with component-based architecture
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Docker Multi-stage Builds**: Optimized container images for both frontend and backend
- **Nginx Reverse Proxy**: Unified frontend serving and API routing
- **Streaming API**: Real-time data streaming for immediate analysis feedback

## License

MIT