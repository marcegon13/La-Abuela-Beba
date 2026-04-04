# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM golang:1.23-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN go build -o server ./cmd/main.go

# Stage 3: Runtime
FROM alpine:latest
WORKDIR /app/backend

# Copy backend binary
COPY --from=backend-builder /app/backend/server .

# Copy frontend build to the expected relative path (../frontend/dist)
COPY --from=frontend-builder /app/frontend/dist ../frontend/dist

# Expose port
EXPOSE 8080

# Environment variables defaults (can be overridden)
ENV PORT=8080

# Run
CMD ["./server"]
