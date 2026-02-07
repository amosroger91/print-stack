FROM node:20-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/core/package.json ./packages/core/
COPY packages/slicer/package.json ./packages/slicer/

# Install deps
RUN pnpm install

# Copy source
COPY . .

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client before building TypeScript
RUN pnpm exec prisma generate

# Build TypeScript
RUN pnpm --filter @print-stack/backend build

# Production image
FROM node:20-slim AS runner

# Install PrusaSlicer deps + PrusaSlicer
RUN apt-get update && apt-get install -y \
    wget \
    libglu1-mesa \
    libgconf-2-4 \
    libgtk-3-0 \
    locales \
    bzip2 \
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    libglib2.0-0 \
    libegl1-mesa \
    libx11-6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen
ENV LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8

# Install PrusaSlicer (Same version as Slicer package)
WORKDIR /slicer
RUN wget https://github.com/prusa3d/PrusaSlicer/releases/download/version_2.7.1/PrusaSlicer-2.7.1+linux-x64-GTK3-202312121425.tar.bz2 \
    && tar -xvf PrusaSlicer-*.tar.bz2 \
    && mv PrusaSlicer-*/bin/prusa-slicer /usr/local/bin/prusa-slicer \
    && rm -rf PrusaSlicer-*

WORKDIR /app

# Enable pnpm in production
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files for production install
COPY package.json pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/core/package.json ./packages/core/
COPY packages/slicer/package.json ./packages/slicer/

# Install production dependencies only
RUN pnpm install --prod

# Copy built code
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Copy Prisma schema (client will be generated at runtime)
COPY --from=builder /app/prisma ./prisma

# Copy profiles - Crucial for Sprint 1
COPY packages/slicer/profiles ./packages/slicer/profiles

# Copy entrypoint script
COPY apps/backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
CMD ["/usr/local/bin/docker-entrypoint.sh"]
