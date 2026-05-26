# Build stage
ARG RUNTIME_PLATFORM=linux/amd64

FROM --platform=$RUNTIME_PLATFORM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

FROM --platform=$RUNTIME_PLATFORM node:22-alpine AS node-runtime

# Production stage
FROM --platform=$RUNTIME_PLATFORM pandoc/extra:3.5.0 AS runner

WORKDIR /app

RUN apk add --no-cache libstdc++

# Copy the supported Node.js runtime into the Pandoc image.
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=node-runtime /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Create directories for file processing
RUN mkdir -p /app/workspace /app/generated-pdfs && \
    chmod -R 777 /app/workspace /app/generated-pdfs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

ENTRYPOINT []
CMD ["npm", "start"]
