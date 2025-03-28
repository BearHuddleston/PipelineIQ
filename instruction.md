**Phase 1: Project Setup & Backend Foundation**

1.  **Environment Setup:**
    -   Install Go (latest stable version recommended).
    -   Install Node.js and npm/yarn (for frontend development).
    -   Install Docker and Docker Compose.
    -   Set up your Go workspace/project structure.
    -   Initialize Go modules: `go mod init <your-project-path>`
    -   Get essential Go backend dependencies:
        -   `go get -u github.com/gin-gonic/gin` (Gin framework)
        -   `go get -u gorm.io/gorm` (GORM ORM)
        -   `go get -u gorm.io/driver/postgres` or `gorm.io/driver/sqlite` (GORM DB driver)
        -   Choose and `go get` a logging library (e.g., `go get -u go.uber.org/zap` or `go get -u github.com/rs/zerolog`).
        -   Choose and `go get` an LLM client library (e.g., for OpenAI).
2.  **Configuration Management:**
    -   Plan how to manage configuration (environment variables are required). Consider libraries like Viper or rely on `os.Getenv`.
    -   Define required environment variables (e.g., `DATABASE_URL`, `OPENAI_API_KEY`, `PORT`, API URLs for data sources).
3.  **Database Schema & GORM Models:**
    -   Design the database schema. You'll likely need tables for:
        -   Raw ingested data (consider one table per source or a flexible structure).
        -   Processed/transformed data.
        -   LLM analysis summaries.
    -   Define corresponding GORM models (`struct`s) in Go for each table, including necessary fields and tags (`gorm:"..."`).
    -   Implement database connection logic using GORM, reading connection details from configuration.
    -   _Optional but Recommended:_ Set up GORM AutoMigrate or a separate migration tool (`golang-migrate/migrate`, etc.) to manage schema changes.
4.  **Initial Gin Setup:**
    -   Create a basic Gin engine (`r := gin.Default()`).
    -   Set up basic middleware (logging, recovery - Gin includes defaults).
    -   Define a health check endpoint (e.g., `GET /ping`) to verify the server is running.

**Phase 2: Backend - Core Logic**

5.  **Data Ingestion Service:**
    -   Create Go functions to fetch data from the two chosen public APIs.
    -   Use Go's `net/http` client.
    -   Implement concurrency using goroutines to fetch from both sources simultaneously (e.g., using a `sync.WaitGroup` or channels).
    -   Handle potential errors gracefully: network timeouts, non-2xx status codes, JSON parsing errors. Log errors appropriately.
    -   Store the raw fetched data in the database using GORM.
6.  **Data Processing/Transformation Service:**
    -   Create Go functions to perform the required transformations:
        -   Retrieve raw data from the database using GORM.
        -   Merge/combine the datasets logically.
        -   Implement filtering/grouping logic.
        -   Implement calculation of derived statistics.
    -   Address potential concurrency issues if transformations involve shared resources or database updates that could conflict (use GORM transactions or Go's sync primitives if necessary).
    -   Store the processed data in its dedicated database table using GORM.
7.  **LLM Integration Service:**
    -   Create a Go function to interact with the chosen LLM API.
    -   Pass the relevant processed data (or a summary/subset if data is large) to the LLM based on your prompt design.
    -   Handle the LLM API response, including potential errors (API errors, rate limits). Log errors.
    -   Securely load the LLM API key from configuration (environment variable).
    -   Store the generated summary/insight in the dedicated LLM analysis table using GORM.
8.  **API Endpoint Implementation (Gin Handlers):**
    -   `POST /fetch_and_process`:
        -   Define a Gin handler function.
        -   Trigger the data ingestion, processing, and LLM integration steps sequentially or manage asynchronously (returning a job ID is a good approach for long tasks).
        -   Return an appropriate response (e.g., `202 Accepted` with a job ID, or `200 OK` if synchronous and fast). Handle and log errors, returning appropriate 4xx/5xx status codes.
    -   `GET /results`:
        -   Define a Gin handler function.
        -   Query the database for processed data using GORM.
        -   Implement optional filtering based on query parameters (e.g., `?date=YYYY-MM-DD`). Validate parameters.
        -   Return the data as JSON with a `200 OK` status. Handle errors (e.g., `404 Not Found`).
    -   `GET /analysis`:
        -   Define a Gin handler function.
        -   Query the database for the latest LLM summary using GORM.
        -   Optionally support retrieving specific summaries if multiple are stored (e.g., via ID or timestamp parameter).
        -   Return the summary as JSON with a `200 OK` status. Handle errors.
9.  **Logging Implementation:**
    -   Integrate the chosen logging library throughout the ingestion, processing, LLM, and API layers. Log key events, errors, and relevant context.
10. **Backend Testing:**
    -   Write unit tests for transformation logic functions.
    -   Write integration tests for:
        -   Data fetching (mock the external HTTP APIs).
        -   LLM interaction (mock the LLM client/API).
        -   API endpoints (using Go's `net/http/httptest` package).
    -   Aim for good test coverage.

**Phase 3: Frontend Development (React/Typescript)**

11. **Project Initialization:**
    -   Use Vite: `npm create vite@latest my-frontend -- --template react-ts`.
    -   Set up basic project structure (components, services/API clients, styles).
12. **API Client Service:**
    -   Create Typescript functions/classes to interact with the Go backend API endpoints (`/fetch_and_process`, `/results`, `/analysis`). Use `Workspace` or install/use `axios`.
    -   Define Typescript interfaces/types for the expected API request payloads and response data structures.
13. **UI Components:**
    -   Create reusable React components (using Typescript `.tsx` files):
        -   A button or form component to trigger the `/fetch_and_process` POST request.
        -   Component(s) to display the processed data from `/results` (e.g., in a table).
        -   A component to display the LLM analysis from `/analysis`.
        -   Components for layout, loading indicators, error messages.
14. **State Management:**
    -   Use React Hooks (`useState`, `useEffect`, `useContext`) for managing component state, API call status (loading, success, error), and fetched data.
    -   If application complexity grows, consider implementing Context API or a dedicated state management library (Redux Toolkit, Zustand).
15. **Routing (Optional):**
    -   If building a multi-view application, install and configure `react-router-dom`.
16. **Styling:**
    -   Apply styling using your chosen method (CSS Modules, Styled Components, Tailwind CSS, etc.) to achieve a polished and creative design.
17. **Frontend Testing (Optional):**
    -   If time permits, use Jest and React Testing Library to write basic tests for component rendering and simple interactions.

**Phase 4: Dockerization & Documentation**

18. **Backend Dockerfile (`backend/Dockerfile`):**
    -   Create a multi-stage Dockerfile for the Go backend.
        -   Stage 1: Build the Go binary using a Go base image.
        -   Stage 2: Copy the compiled binary into a minimal runtime image (like `alpine` or `distroless`).
    -   Expose the application port (e.g., 8080).
    -   Define the `CMD` to run the compiled binary.
19. **Frontend Dockerfile (`frontend/Dockerfile`):**
    -   Create a multi-stage Dockerfile for the React frontend.
        -   Stage 1: Build the static assets using a Node.js base image (`npm run build` or `yarn build`).
        -   Stage 2: Copy the built static assets into a web server image (like `nginx`).
    -   Configure Nginx (or chosen server) to serve the static files and potentially proxy API requests to the backend container.
20. **Docker Compose (`docker-compose.yml`):**
    -   Define services for:
        -   `backend`: Build from the backend Dockerfile, map ports, pass environment variables (potentially via a `.env` file).
        -   `frontend`: Build from the frontend Dockerfile, map ports.
        -   `database` (Optional but recommended): Use official Postgres/SQLite images, configure volumes for data persistence, pass credentials.
    -   Define networks to allow containers to communicate.
21. **README.md:**
    -   Write comprehensive documentation covering:
        -   Project overview.
        -   Prerequisites (Docker).
        -   Environment variable setup (list needed variables, explain `.env` file use).
        -   How to build and run the application using `docker-compose up --build`.
        -   How to run backend tests.
        -   API endpoint descriptions (can link to Gin auto-generated docs if implemented).
        -   Key design decisions and chosen libraries.

**Phase 5: Submission**

22. **Final Checks:**
    -   Ensure all code is committed to the repository.
    -   Verify the application builds and runs correctly using the `docker-compose` instructions.
    -   Confirm the README is complete and accurate.
23. **Submit:** Provide the repository link.
