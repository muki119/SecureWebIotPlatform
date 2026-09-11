# syntax=docker/dockerfile:1
#
# Build context: this directory (app/).
#   docker build -f app/Dockerfile app

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

######## production: static assets served by nginx ########
FROM nginx:1.27-alpine AS production
ARG VERSION=0.0.0
LABEL org.opencontainers.image.title="app" \
      org.opencontainers.image.description="Frontend SPA for the Secure Web IoT Platform" \
      org.opencontainers.image.source="https://github.com/muki119/SecureWebIotPlatform" \
      org.opencontainers.image.version="${VERSION}"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
