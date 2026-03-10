# API Gateway - Docker Image
# Multi-stage build for optimized image size
# Stage 1: Build dependencies
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies (works even when lockfile is not committed)
RUN npm install --omit=dev --no-audit --no-fund

# Stage 2: Runtime image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy built node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY src ./src

# Set environment
ENV NODE_ENV=production
ENV PORT=8000

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "src/server.js"]
