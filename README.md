# PipelineIQ

A Go and TypeScript application that fetches data from public APIs, processes it, and uses an LLM to generate insights.

## Project Overview

PipelineIQ is a full-stack application that demonstrates a complete data pipeline:

1. **Data Ingestion**: Concurrently fetches data from multiple external APIs
2. **Data Processing**: Combines and transforms the raw data into meaningful insights
3. **LLM Analysis**: Uses OpenAI's GPT models to generate human-readable analysis
4. **Interactive Dashboard**: Displays the processed data and insights in a React frontend

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
- Go 1.16 or higher (for local development)
- Node.js and npm/yarn (for local frontend development)
- PostgreSQL database (or use the containerized version)

## Environment Variables

Copy the example environment file and adjust as needed:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: API key for OpenAI (required for LLM analysis)
- `API_URL_1` and `API_URL_2`: URLs for the two data sources
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

### Backend Development

```bash
# Run the backend locally
go run cmd/app/main.go

# Run tests
go test ./...

# Build the backend
go build -o pipelineiq ./cmd/app
```

### Frontend Development

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

## Design Decisions

- **Concurrent Data Fetching**: Used Go's goroutines and channels for efficient parallel data retrieval
- **GORM ORM**: Simplified database operations with automatic migrations
- **Gin Web Framework**: Lightweight, high-performance HTTP router
- **React + TypeScript**: Type-safe frontend development with component-based architecture
- **Docker Multi-stage Builds**: Optimized container images for both frontend and backend
- **Nginx Reverse Proxy**: Unified frontend serving and API routing

## License

MIT