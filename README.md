# PipelineIQ

A Go and TypeScript application that fetches data from public APIs, processes it, and uses an LLM to generate insights.

## Project Structure

```
PipelineIQ/
├── cmd/
│   └── app/          # Application entrypoint
├── internal/
│   ├── api/          # API handlers and routes
│   ├── config/       # Configuration management
│   ├── database/     # Database connection and migrations
│   ├── models/       # GORM data models
│   └── services/     # Business logic services
└── frontend/         # React/TypeScript frontend (to be added)
```

## Setup

### Prerequisites

- Go 1.16 or higher
- Node.js and npm/yarn
- Docker and Docker Compose
- PostgreSQL database

### Environment Variables

Copy the example environment file and adjust as needed:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: API key for OpenAI
- `API_URL_1` and `API_URL_2`: URLs for the two data sources
- `PORT`: HTTP server port (defaults to 8080)

## Development

### Running Locally

```bash
# Build and run the Go backend
go run cmd/app/main.go

# Run frontend (once implemented)
cd frontend && npm run dev
```

### Running with Docker

```bash
# Build and start all services
docker-compose up --build
```

## API Endpoints

- `GET /ping`: Health check endpoint
- `POST /fetch_and_process`: Trigger data pipeline
- `GET /results`: Get processed data
- `GET /analysis`: Get LLM-generated insights

## License

MIT