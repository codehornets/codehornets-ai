# Multi-stage Dockerfile for CRM Service

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY nx.json ./

# Copy workspace files
COPY apps/crm-service ./apps/crm-service

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Build the application
RUN npx nx build crm-service --configuration=production

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy built application from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist/apps/crm-service ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV CRM_SERVICE_HOST=0.0.0.0
ENV CRM_SERVICE_PORT=3002

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('net').connect(3002, '0.0.0.0').on('connect', () => process.exit(0))" || exit 1

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
