# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install Docker CLI only (for docker exec to pandoc container)
RUN apk add --no-cache docker-cli

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Create directories for file processing
RUN mkdir -p /app/workspace /app/generated-pdfs && \
    chmod -R 777 /app/workspace /app/generated-pdfs

# Run as root to access Docker socket
# In production, consider using Docker API instead

EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV production

CMD ["npm", "start"]