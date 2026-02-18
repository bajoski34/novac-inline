# Docker Deployment Guide for Novac Inline

This guide explains how to deploy the novac-inline script to a CDN using Docker.

## Overview

The Docker setup provides:
- **Multi-stage build**: Optimized image size by separating build and runtime dependencies
- **Production-ready**: Alpine-based image for minimal footprint
- **Health checks**: Automatic health monitoring
- **Easy testing**: Local HTTP server for testing before CDN deployment

## Prerequisites

- Docker 20.10+ 
- Docker Compose 1.29+ (optional, for easier deployment)
- 256MB minimum free disk space

## Building the Docker Image

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and start the service
docker-compose up --build

# Build only (without starting)
docker-compose build
```

### Option 2: Using Docker CLI

```bash
# Build the image
docker build -t novac-inline:latest .

# Build with custom tag
docker build -t novac-inline:1.0.1 .
```

## Running the Container

### Option 1: Using Docker Compose

```bash
# Start the service
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Option 2: Using Docker CLI

```bash
# Run the container
docker run -d -p 8080:8080 --name novac-inline-cdn novac-inline:latest

# Run with custom environment
docker run -d \
  -p 8080:8080 \
  -e NODE_ENV=production \
  --name novac-inline-cdn \
  novac-inline:latest

# View logs
docker logs -f novac-inline-cdn

# Stop the container
docker stop novac-inline-cdn
docker rm novac-inline-cdn
```

## Testing Locally

Once the container is running, test it locally:

```bash
# Test the built script is available
curl http://localhost:8080/novac-inline.js

# Check health
curl http://localhost:8080/health

# View all available files
curl http://localhost:8080
```

## Deploying to CDN

### Method 1: Extract Built Files

Build locally and extract the `dist` folder:

```bash
docker build -t novac-inline:latest .
docker create --name temp novac-inline:latest
docker cp temp:/cdn . 
docker rm temp

# Now upload the 'cdn' folder to your CDN provider
```

### Method 2: Using Container Registry + CDN

1. **Push to container registry** (Docker Hub, ECR, etc.):

```bash
# Tag for registry
docker tag novac-inline:latest your-registry/novac-inline:latest

# Push to registry
docker push your-registry/novac-inline:latest
```

2. **Deploy to production**:
   - Use your CDN provider's container deployment service
   - Or pull the image on your server and run it

### Method 3: Direct Deployment Service

Popular options:
- **AWS ECS**: Push image to ECR, deploy via ECS Fargate
- **Google Cloud Run**: Push to Artifact Registry, deploy
- **Azure Container Instances**: Push to ACR, deploy
- **Heroku**: Push to container registry
- **DigitalOcean App Platform**: Connect GitHub repo for auto-deploy

## CDN Integration Examples

### jsDelivr (Recommended)

Once deployed:

```html
<script src="https://cdn.jsdelivr.net/gh/your-username/novac-inline@latest/dist/novac-inline.js"></script>
```

### unpkg

```html
<script src="https://unpkg.com/novac-inline@latest/dist/novac-inline.js"></script>
```

### Custom CDN

```html
<script src="https://your-cdn.example.com/novac-inline.js"></script>
```

## Environment Variables

The following environment variables can be configured:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| Port | `8080` | HTTP server port (via Docker) |

## Performance Optimization

### Image Size
The multi-stage build reduces image size significantly:
- Builder stage: includes dev dependencies (~300MB)
- Final stage: only runtime (~50MB)

### Caching Headers

The HTTP server is configured with cache busting:
```bash
# Max age is set to -1 (no cache) for development/testing
# For production CDN, configure your CDN provider's cache rules
```

## Troubleshooting

### Port Already in Use

```bash
# Use a different port
docker run -d -p 8081:8080 novac-inline:latest

# Or kill the process using port 8080
lsof -ti:8080 | xargs kill -9
```

### Health Check Failing

```bash
# Check container logs
docker logs novac-inline-cdn

# Test connectivity manually
curl -v http://localhost:8080/novac-inline.js
```

### Build Failures

```bash
# Rebuild without cache
docker build --no-cache -t novac-inline:latest .

# Build with verbose output
docker build -t novac-inline:latest --progress=plain .
```

## Security Considerations

1. **HTTPS**: Configure your CDN to serve over HTTPS
2. **CORS**: Configure CORS headers as needed
3. **Integrity**: Use Subresource Integrity (SRI) hashes when including the script
4. **Updates**: Keep base image (`node:18-alpine`) updated

### Example SRI Usage

```html
<script 
  src="https://your-cdn.example.com/novac-inline.js"
  integrity="sha384-[hash-here]"
  crossorigin="anonymous">
</script>
```

Generate hash:

```bash
curl https://your-cdn.example.com/novac-inline.js | \
  openssl dgst -sha384 -binary | \
  openssl enc -base64 -A
```

## Maintenance

### Updating Dependencies

```bash
# Update package.json dependencies
npm update

# Rebuild the image
docker build -t novac-inline:latest .

# Test before deploying
docker run -p 8080:8080 novac-inline:latest
```

### Monitoring

```bash
# Check container stats
docker stats novac-inline-cdn

# View resource usage
docker container inspect novac-inline-cdn
```

## Clean Up

```bash
# Remove stopped containers
docker container prune

# Remove dangling images
docker image prune

# Remove everything (careful!)
docker system prune -a
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Alpine Linux](https://alpinelinux.org/)
- [HTTP Server](https://www.npmjs.com/package/http-server)

## Support

For issues related to:
- **novac-inline**: Check the main repository
- **Docker**: Refer to Docker documentation
- **CDN deployment**: Contact your CDN provider's support

