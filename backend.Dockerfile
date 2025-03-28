# Stage 1: Build the Go application
FROM golang:1.20-alpine AS builder

# Install git
RUN apk update && apk add --no-cache git

# Set the working directory
WORKDIR /app

# Copy go.mod and go.sum files to download dependencies
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /go/bin/app ./cmd/app

# Stage 2: Create a minimal image
FROM alpine:3.17

# Add CA certificates for HTTPS
RUN apk --no-cache add ca-certificates

# Copy the binary from the builder stage
COPY --from=builder /go/bin/app /app

# Set working directory
WORKDIR /

# Expose the port
EXPOSE 8080

# Run the application
CMD ["/app"]
