# Base stage for dependencies
FROM node:20-slim AS deps
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
# Force install sharp for linux-x64 to ensure native bindings are present for the container
RUN npm install --os=linux --cpu=x64 sharp

# Build stage
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Runner stage
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install system dependencies for image and PDF processing
RUN apt-get update && apt-get install -y \
    ghostscript \
    qpdf \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1001 nodejs
RUN useradd --uid 1001 --gid nodejs nextjs

# Copy fonts if needed (Ghostscript might need them)
# COPY --from=builder /app/public ./public

# Set up output directory with correct permissions
RUN mkdir -p public/processed && chown -R nextjs:nodejs public/processed

# Copy built application
# Copy everything for standard build since standalone is having issues
COPY --from=builder --chown=nextjs:nodejs /app ./

# Ensure correct permissions for public/processed
RUN mkdir -p public/processed && chown -R nextjs:nodejs public/processed

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "start"]
