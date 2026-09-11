# syntax=docker/dockerfile:1
#
# Build context: the `services/` workspace root (not this directory).
#   docker build -f services/authentication/Dockerfile services

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
COPY authentication/ ./authentication/
COPY common/ ./common/
COPY eventbus/ ./eventbus/
RUN npm run build --workspace=@services/authentication

######## production ########
FROM node:24-bookworm-slim AS production
WORKDIR /app
ARG VERSION=0.0.0
LABEL org.opencontainers.image.title="authentication" \
      org.opencontainers.image.description="Authentication service for the Secure Web IoT Platform" \
      org.opencontainers.image.source="https://github.com/muki119/SecureWebIotPlatform" \
      org.opencontainers.image.version="${VERSION}"

ENV NODE_ENV=production \
    PORT=2556 \
    OTEL_SERVICE_NAME=authentication \
    OTEL_PROMETHEUS_PORT=9464

# @services/common + @services/eventbus are bundled into dist by esbuild, so the
# runtime only needs the external npm deps that npm ci --omit=dev resolved (incl.
# the shared packages' own transitive deps).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/authentication/dist ./dist
COPY --from=build /app/authentication/package.json ./package.json
RUN rm -rf ./node_modules/@services

EXPOSE 2556 9464
USER node
CMD ["node", "--import", "./dist/instrumentation.js", "dist/index.js"]
