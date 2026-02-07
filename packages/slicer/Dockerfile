FROM node:20-slim AS builder

# Install PrusaSlicer deps
RUN apt-get update && apt-get install -y \
    wget \
    libglu1-mesa \
    libgconf-2-4 \
    libgtk-3-0 \
    locales \
    bzip2 \
    && rm -rf /var/lib/apt/lists/*

RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8

# Install PrusaSlicer
WORKDIR /slicer
# Using a specific known version URL or fallback to a robust method (here using a generic recent one for v0)
# In production, pin this to a specific sha
RUN wget https://github.com/prusa3d/PrusaSlicer/releases/download/version_2.7.1/PrusaSlicer-2.7.1+linux-x64-GTK3-202312121425.tar.bz2 \
    && tar -xvf PrusaSlicer-*.tar.bz2 \
    && mv PrusaSlicer-*/bin/prusa-slicer /usr/local/bin/prusa-slicer \
    && rm -rf PrusaSlicer-*

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY package.json pnpm-workspace.yaml ./
COPY packages/slicer/package.json ./packages/slicer/
COPY packages/core/package.json ./packages/core/

# Install deps
RUN pnpm install

# Copy source
COPY packages/slicer ./packages/slicer
COPY packages/core ./packages/core

# Build
RUN pnpm --filter @print-stack/slicer build
RUN pnpm --filter @print-stack/core build

# We will run this as a service, or just use it as a library if we merge backend/slicer.
# For simplicity in Sprint 1, we might run the backend IN this image, 
# or have the backend call out to this service.
# Let's assume the backend will invoke this via a shared volume or HTTP. 
# For now, let's make this a worker that can process jobs.

CMD ["node", "packages/slicer/dist/index.js"] 
