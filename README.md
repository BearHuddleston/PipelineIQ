# PipelineIQ App

An example full-stack application that demonstrates:

-   **Asynchronous data fetching** from multiple external APIs (simulated).
-   **Data processing** and storage in an SQLite database using [GORM](https://gorm.io/).
-   **LLM integration** (stubbed, but can be extended to call OpenAI or similar).
-   **REST API** built with [Gin](https://github.com/gin-gonic/gin).
-   **React + TypeScript** frontend bundled with [Parcel](https://parceljs.org/).

This project shows how to serve a built React app from a Go server, providing both a front-end user interface and back-end API routes under one repository.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Running the Application](#running-the-application)
5. [API Endpoints](#api-endpoints)
6. [Frontend Development](#frontend-development)
7. [Testing](#testing)
8. [Extending the LLM Integration](#extending-the-llm-integration)
9. [License](#license)

---

## Project Structure

```
project-root/
├── main.go                    # Go server entry point
├── go.mod                     # Go module definition
├── go.sum                     # Go module dependencies
├── web/
│   └── frontend/
│       ├── dist/              # Output of npm run build (Parcel)
│       ├── src/               # Source code for the React/TypeScript app
│       │   ├── index.html
│       │   ├── index.tsx
│       │   └── App.tsx
│       ├── package.json
│       ├── tsconfig.json
│       └── .parcel-cache/
├── data.db                    # SQLite database (auto-created on first run)
└── README.md                  # This file
```

-   **`main.go`** contains the Gin server, routes, and logic for data fetching, processing, and LLM stubs.
-   **`web/frontend/`** holds the React/TypeScript frontend. The build artifacts go into `dist/`, which the Go server serves at runtime.

---

## Prerequisites

1. **Go 1.18+**  
   [Installation Guide](https://go.dev/doc/install)
2. **Node.js 14+**  
   [Download & Install Node.js](https://nodejs.org/)
3. **npm or yarn** for managing frontend dependencies.

---

## Installation & Setup

1. **Clone the Repository**

```bash
git clone https://github.com/BearHuddleston/PipelineIQ.git
cd PipelineIQ
```

2. **Install Go Dependencies**

```bash
go mod tidy
```

This fetches all Go modules required by the project.

3. **Install Frontend Dependencies**

```bash
cd web/frontend
npm install
# or
yarn install
```

This installs React, TypeScript, and Parcel dependencies.

---

## Running the Application

1. **Build the Frontend**

In the `web/frontend` directory:

```bash
npm run build
```

This compiles the React app and outputs bundled files to `web/frontend/dist`. The paths to the JS files are prefixed with `/static/` (configured via Parcel’s `--public-url`).

2. **Run the Go Server**

In the project root (where `main.go` is located):

```bash
go run main.go
```

-   The server starts on port `8080` by default.
-   It serves the compiled React app at any path not matching an API route, with static assets under `/static`.

3. **Open in Browser**

Navigate to [http://localhost:8080](http://localhost:8080) to view the React UI.

-   From the UI, you can trigger data fetching and processing.
-   The server logs will show the asynchronous operations.

---

## API Endpoints

By default, these routes are grouped under `/api` (if using a prefix):

### `POST /api/fetch_and_process`

-   Triggers asynchronous fetching from two external APIs (simulated), merges the data, saves it to SQLite, and generates an LLM summary (stubbed).

### `GET /api/results`

-   Returns the processed data from the database in JSON format.

### `GET /api/analysis`

-   Returns the latest LLM-generated summary.

---

## Frontend Development

### Development Server

In the `web/frontend` folder:

```bash
npm run start
```

Parcel will start a development server, usually at [http://localhost:1234](http://localhost:1234).

> **Note**: In dev mode, you may need to configure a proxy for API requests to `http://localhost:8080`.

### Production Build

```bash
npm run build
```

Creates an optimized production build in `web/frontend/dist`. The Go server serves these static assets at runtime.

---

## Testing

### Backend Tests

Use Go’s built-in testing:

```bash
go test ./...
```

This runs all tests in the current module.

### Frontend Tests

Using Jest / React Testing Library (optional setup):

```bash
npm test
```

Runs tests for your React components.

---

## Extending the LLM Integration

### OpenAI or Another Provider

In `main.go`, the `callLLM()` function is currently a stub. Replace it with real logic:

```go
// Example with OpenAI
func callLLM(summaryData string) (string, error) {
    // Implement your call to OpenAI's GPT-3.5 or GPT-4
    // Handle API keys, error cases, etc.
    // Return the summarized text
}
```

### Environment Variables

Store your API key securely (e.g., in `.env` or a secret manager). Don’t commit secrets to version control.

---

## License

This project is provided under the **MIT License**. You are free to modify and distribute it as needed. See the `LICENSE` file for details.
