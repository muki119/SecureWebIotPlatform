# syntax=docker/dockerfile:1

FROM golang:1.27.1-bookworm AS build
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /mailer ./cmd/mailer

FROM debian:bookworm-slim AS production
WORKDIR /app
ARG VERSION=0.0.0
LABEL org.opencontainers.image.title="mailer" \
	org.opencontainers.image.description="Email delivery service for the Secure Web IoT Platform" \
	org.opencontainers.image.source="https://github.com/muki119/SecureWebIotPlatform" \
	org.opencontainers.image.version="${VERSION}"

RUN apt-get update \
	&& apt-get install --no-install-recommends --yes ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=build /mailer ./mailer
COPY internal/templates ./templates

ENV OTEL_SERVICE_NAME=mailer \
	OTEL_PROMETHEUS_PORT=9464

EXPOSE 9464
USER nobody
CMD ["./mailer"]