# Multi-stage build for novac-inline CDN deployment
# Stage 1: Build stage
FROM node:23-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=prod && \
    npm ci --only=dev

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Stage 2: Production stage - minimal image for serving
FROM node:23-alpine

WORKDIR /app

# Install a simple HTTP server.
RUN npm install -g http-server

# Copy only the built artifacts from builder
COPY --from=builder /app/dist ./dist

# Create a directory for CDN artifacts
RUN mkdir -p /cdn && \
    cp -r ./dist/* /cdn/

# Expose port for local testing (optional)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/novac-inline.js || exit 1

# Default command: serve the dist folder
CMD ["http-server", "/cdn", "-p", "8080", "-c-1", "--gzip"]

