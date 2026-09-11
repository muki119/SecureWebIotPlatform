# syntax=docker/dockerfile:1
#
# Build context: the `services/` workspace root (not this directory).
#   docker build -f services/devicecontrol/Dockerfile services

######## deps: production-only node_modules for the final image ########
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
COPY authentication/package*.json ./authentication/
COPY common/package*.json ./common/
COPY devicecontrol/package*.json ./devicecontrol/
COPY domain/package*.json ./domain/
COPY eventbus/package*.json ./eventbus/
COPY ledger/package*.json ./ledger/
RUN npm ci --omit=dev

######## build: full workspace install + esbuild bundle ########
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY authentication/package*.json ./authentication/
COPY common/package*.json ./common/
COPY devicecontrol/package*.json ./devicecontrol/
COPY domain/package*.json ./domain/
COPY eventbus/package*.json ./eventbus/
COPY ledger/package*.json ./ledger/
RUN npm ci
COPY tsconfig.service.json ./
COPY devicecontrol/ ./devicecontrol/
COPY common/ ./common/
COPY eventbus/ ./eventbus/
RUN npm run build --workspace=@services/devicecontrol

######## production ########
FROM node:24-bookworm-slim AS production
WORKDIR /app
ARG VERSION=0.0.0
LABEL org.opencontainers.image.title="devicecontrol" \
      org.opencontainers.image.description="Device control service for the Secure Web IoT Platform" \
      org.opencontainers.image.source="https://github.com/muki119/SecureWebIotPlatform" \
      org.opencontainers.image.version="${VERSION}"

ENV NODE_ENV=production \
    PORT=2558 \
    OTEL_SERVICE_NAME=devicecontrol \
    OTEL_PROMETHEUS_PORT=9464

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/devicecontrol/dist ./dist
COPY --from=build /app/devicecontrol/package.json ./package.json
RUN rm -rf ./node_modules/@services

EXPOSE 2558 9464
USER node
CMD ["node", "--import", "./dist/instrumentation.js", "dist/index.js"]
