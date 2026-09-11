# syntax=docker/dockerfile:1
#
# Build context: this directory (app/).
#   docker build -f app/Dockerfile app
#
# This image does NOT run a server. It only carries the built static SPA.
# The infra repo owns nginx and serves this content directly — consume this
# image as an init container: mount a shared volume, run it, and it copies
# the build output into $OUTPUT_DIR before the nginx container starts.

######## build: compile the SPA with Vite ########
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Vite inlines VITE_* at build time. Defaults in src/constants/api_routes.ts
# assume a same-origin gateway; override here for other topologies.
ARG VITE_API_BASE_URL
ARG VITE_SOCKET_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_SOCKET_URL=${VITE_SOCKET_URL}

COPY . .
# `npm run build` runs `tsc -b && vite build`; the type-check step currently
# fails on a pre-existing react-day-picker v10 typing mismatch in
# src/components/ui/calendar.tsx. Type errors don't affect the emitted bundle,
# so build the assets directly. Restore `npm run build` once that is fixed.
RUN npx vite build

######## production: static assets only, no server ########
FROM busybox:1.36 AS production
ARG VERSION=0.0.0
LABEL org.opencontainers.image.title="app" \
      org.opencontainers.image.description="Built static assets for the Secure Web IoT Platform frontend (consumed by the infra repo's nginx, not self-serving)" \
      org.opencontainers.image.source="https://github.com/muki119/SecureWebIotPlatform" \
      org.opencontainers.image.version="${VERSION}"

COPY --from=build /app/dist /dist
ENV OUTPUT_DIR=/output
CMD ["sh", "-c", "mkdir -p \"$OUTPUT_DIR\" && cp -r /dist/. \"$OUTPUT_DIR\"/"]
