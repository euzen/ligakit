# Back4App Dockerfile for Next.js
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Build the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application (standalone output for Docker)
ENV DOCKER_BUILD=1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files
COPY --from=builder /app/.next/standalone ./.next/standalone
COPY --from=builder /app/.next/static ./.next/standalone/.next/static
COPY --from=builder /app/public ./.next/standalone/public
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Copy Prisma files and node_modules for CLI
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/node_modules ./node_modules

# Create writable directories for local data (overridden by volume mounts at runtime)
RUN mkdir -p /app/data/uploads/teams /app/data/uploads/avatars /app/data/uploads/sports \
    && mkdir -p /app/.next/standalone/public/uploads \
    && chmod +x docker-entrypoint.sh

# Expose port (Back4App uses PORT env variable)
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Database URL for SQLite in container
ENV DATABASE_URL="file:/app/data/dev.db"

# Start the application
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
CMD ["node", ".next/standalone/server.js"]
