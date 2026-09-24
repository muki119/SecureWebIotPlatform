# AI Agent Guidelines & Repository Knowledge

This document provides essential instructions, architecture maps, and validated commands for autonomous AI coding agents working on the **Secure Web IoT Platform**.

---

## 1. Project Summary & Architecture

The **Secure Web IoT Platform** is a multi-tenant, microservices-based web application for managing and controlling IoT devices securely over MQTT and WebSockets, with domain-scoped RBAC, JWT session management, real-time telemetry, and audit logging.

> **Project context**: This is a personal project the maintainer works on for learning, fun, and applying their knowledge. It is not academic/coursework and has no submission deadline. Favour sound engineering, sensible scope, and approaches worth learning from; there is no grade or marking scheme to optimise for.

### Technology Stack

- **Runtimes & Languages**: Node.js (v22+), TypeScript (ESNext), React 19, Go (1.27+, `services/mailer`).
- **Backend Architecture**: Microservices inside an npm workspace (`services/`), built with Express 5, OpenTelemetry, Redis pub/sub (`services/eventbus`), Socket.io, and MQTT (EMQX broker). `services/mailer` is a separate, Go service (its own `go.mod`, tied together with the npm-based services only via a `services/go.work` Go workspace file) that consumes the Redis event bus directly (`github.com/muki119/go-slim-event-bus/v2`) to send transactional email (user created/deleted, password reset) over SMTP.
- **Databases**:
  - **PostgreSQL**: User authentication (`services/authentication`), domains & roles (`services/domain`), and audit logs (`services/ledger`).
  - **MongoDB**: Device metadata, capability states, and telemetry time-series (`services/devicecontrol`).
  - **Redis**: Shared event bus streams, cache, rate-limiting state, and Socket.io cluster adapter.
- **Frontend Architecture**: SPA located in `app/` using Vite 7, React 19, Tailwind CSS v4, Radix UI, TanStack React Query, and Lucide React.
- **Reverse Proxy**: Nginx (`demo/nginx.docker.conf`, `demo/nginx.self.conf`).
- **Code Quality**: Biome (`biome.json`, `app/biome.json`) for TS/React; `go vet` for the Go mailer service.
- **Observability**: OpenTelemetry throughout, including in Go — `services/mailer` exports logs and traces via OTLP/HTTP and metrics via a pull-based Prometheus exporter (`/metrics` on `OTEL_PROMETHEUS_PORT`, default `9464`).

---

## 2. Repository Layout

``` text
SecureWebIotPlatform/
├── .github/
│   ├── copilot-instructions.md       # Copilot cloud agent instructions
│   └── workflows/
│       ├── code_quality.yml          # Biome CI lint/format check
│       └── run_tests.yml             # Matrix Vitest runner for backend services
├── app/                              # Frontend React SPA
│   ├── src/                          # UI components, pages, hooks, contexts
│   ├── biome.json                    # Frontend Biome config (overrides shadcn/ui)
│   ├── package.json
│   └── vite.config.ts
├── demo/                             # Local development docker-compose environment
│   ├── compose.yaml                  # Postgres, Mongo, Redis, EMQX, Nginx stack
│   ├── init_db.sql                   # Database initialization script
│   └── certs/                        # Self-signed SSL certificates for demo
├── demo_device/                      # Virtual IoT device simulator in Node.js
├── services/                         # Root npm workspace for backend microservices, plus a separate Go workspace
│   ├── package.json                  # npm workspaces configuration (TS services)
│   ├── tsconfig.service.json         # Shared TypeScript compiler options
│   ├── go.work                       # Go workspace file (currently `use mailer`)
│   ├── authentication/               # User auth, JWT token pairs, Argon2id/scrypt
│   ├── common/                       # Shared models, types, middleware, utils, telemetry
│   ├── devicecontrol/                # Device registry, capability routing, MQTT/Socket.io
│   ├── domain/                       # Multi-tenant domains, members, permissions
│   ├── eventbus/                     # Redis Stream-based inter-service message bus
│   ├── ledger/                       # Centralized audit logging service
│   └── mailer/                       # Go service: consumes the event bus, sends templated SMTP email
│       ├── cmd/mailer/main.go        # Entry point; wires signal handling to graceful App.Stop()
│       ├── internal/app/             # App struct: wires event bus, OTel logger/tracer/meter, handlers
│       ├── internal/handlers/        # Event bus handlers (one per stream) + WithInstrumentation wrapper
│       ├── internal/services/        # Business logic; Sender/CreateMailContent are injectable fields for testing
│       ├── internal/helpers/         # SMTP auth/send (Mailer type)
│       ├── internal/templates/       # html/template email bodies (user_created, user_deleted, password_reset)
│       ├── internal/constants/       # Event bus stream name constants
│       └── .env.example              # Required env vars (SMTP, Redis, OTEL_*)
└── biome.json                        # Root Biome configuration
```

---

## 3. Validated Command Reference

### Bootstrapping Dependencies

```bash
# Backend services (must run from services/ to link workspace packages)
cd services && npm ci

# Frontend application
cd app && npm ci

# Go mailer service (module deps auto-resolve on build/test; explicit download optional)
cd services/mailer && go mod download
```

### Code Quality & Linting
>
> **Note**: CI uses **Biome** for linting/formatting (`npx biome ci ...`) on the TS/React code. While `app/package.json` still contains an ESLint-based `npm run lint` script, Biome is the preferred workflow. The Go mailer service has no Biome equivalent — use `go vet` (and `gofmt`/`go fmt` for formatting).

```bash
# CI verification (matches GitHub Actions)
npx biome ci app
npx biome ci services

# Auto-fix formatting and linting errors
npx biome check --write

# Go mailer service
cd services/mailer && go vet ./...
cd services/mailer && gofmt -l .   # lists any files not gofmt-formatted
```

### Running Tests
>
> **Crucial**: Run Vitest inside individual service directories. Do NOT run `npm test` from the `services/` root directory because `services/eventbus` spawns worker processes using directory-relative paths.

```bash
# 1. Common shared utilities & middleware tests
cd services/common && npx vitest run

# 2. EventBus tests (requires Redis active on localhost:6379)
cd services/eventbus && npx vitest run

# 3. Authentication service tests
cd services/authentication && npx vitest run

# 4. Device control service tests
cd services/devicecontrol && npx vitest run

# 5. Frontend application tests
cd app && npx vitest run

# 6. Go mailer service tests (go test, not Vitest — no Redis/SMTP dependency for the existing unit tests)
cd services/mailer && go test ./...
```

### Building Packages

```bash
# Build backend microservices with esbuild
cd services/authentication && npm run build
cd services/devicecontrol && npm run build
cd services/domain && npm run build
cd services/ledger && npm run build

# Build frontend application
cd app && npm run build

# Build the Go mailer service
cd services/mailer && go build ./...
```

---

## 4. Code & Implementation Conventions

- **Model-Controller-Service Pattern** (TS services):
  - `src/models/`: Database schema definitions, query logic, and interfaces.
  - `src/controllers/`: Express route request handlers and response formatters.
  - `src/services/`: Core business logic, inter-service calls, and event publishing.
  - `src/routes/`: Route declarations and validation middleware attachments.
- **Go mailer service layout** (`services/mailer`, no MCS/Express, event-bus-driven instead of HTTP):
  - `internal/app/`: composition root — builds the event bus connection, OTel providers, and the `Handlers`/`Services` structs (dependency injection by hand, since Go has no DI framework or singletons).
  - `internal/handlers/`: one file per event bus stream, methods on a shared `Handlers` struct. Cross-cutting concerns (tracing spans, metrics) are applied as a decorator (`WithInstrumentation`) at registration time in `app`, not written inside each handler body.
  - `internal/services/`: business logic, methods on a shared `Services` struct. Dependencies that need to be swapped out in tests (the SMTP sender, template rendering) are interface or function-valued fields on `Services`, not concrete types, specifically so `services`/`handlers` tests never need real SMTP/disk I/O.
  - **Interface placement**: declare an interface in the package that *consumes* it, not the package that implements it — the concrete struct stays with its implementing package. E.g. `services.IMailer` is declared in `services` (which only calls `SendMail`) even though `helpers.Mailer` is the concrete implementation; `handlers.IServices` is declared in `handlers` even though `services.Services` is the concrete implementation. This is the standard Go idiom ("accept interfaces, return concrete types") and is what makes the fakes in `*_test.go` possible without a mocking library.
  - `internal/helpers/`: the concrete SMTP implementation (`Mailer`) and other infra-facing code that the `services` interfaces wrap.
  - `internal/templates/`: `html/template` email bodies, one file per event type.
- **Naming Conventions**:
  - TS files: `snake_case.ts` (e.g. `user_controller.ts`, `device_service.ts`).
  - Go files: also `snake_case.go` (e.g. `user_created_handler.go`, `service_types.go`), matching the same file-naming convention across languages.
  - Classes & Types (TS): `PascalCase`.
  - Interfaces: `PascalCase` prefixed with `I` in both languages (e.g. `IUserPayload`, `IDeviceState` in TS; `IMailer`, `IServices` in the Go mailer service) — consistent with the rest of the codebase, even though idiomatic Go usually skips the prefix.
  - Constants: `UPPER_SNAKE_CASE` in both languages.
  - Variables & Parameters (TS): `camelCase`. Go follows standard Go casing: exported identifiers `PascalCase`, unexported `camelCase`.
- **Shared Package Consumption**:
  - Backend TS services import shared code via `@services/common` and `@services/eventbus`. The Go mailer service is intentionally standalone — it talks to the same Redis event bus directly (`github.com/muki119/go-slim-event-bus/v2`) rather than importing anything from `services/common`.
- **Commits & Pull Request Titles**:
  - Follow the [Conventional Commits](https://www.conventionalcommits.org/) spec: `type(scope): summary` (e.g. `feat(authentication): add refresh token rotation`, `fix(devicecontrol): correct MQTT topic parsing`).
  - Allowed types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`, `revert`. Scope is optional; when used it's the affected area: `authentication`, `domain`, `devicecontrol`, `ledger`, `eventbus`, `common`, `mailer`, `app`, `demo`, `release`.
  - Breaking changes use a `!` after the type/scope or a `BREAKING CHANGE:` footer.
  - PRs are **squash-merged**, so the PR title must itself be a valid Conventional Commit — it becomes the commit on `main`. Enforced by `.github/workflows/pr-title.yml` on every PR open/edit.
  - These messages drive automated semantic-versioning: `fix` → patch, `feat` → minor, breaking → major, per service. Each release cuts a `<service>-vX.Y.Z` git tag and builds/pushes that service's container image. A missing or wrong type means a release is skipped or mis-sized.
- **Stateless Authentication**:
  - Services verify user identity and roles via JWT tokens and stateless session verification. Avoid introducing cross-service direct database queries.
- **Testing Rule**:
  - If any proposed feature, utility, helper, middleware, validator, or module is easily testable (e.g. pure logic, deterministic functions, transformers, validators, models), always create automated unit/integration tests covering normal and edge cases: `*.test.ts` with Vitest for TS services, `*_test.go` with `go test` for `services/mailer`.
  - **Style**: write each case as its own explicit test, not a parameterized/table-driven one — no `for` loop over a slice of cases, no `it.each([...])`/`test.each([...])`.
    - Go: one `func TestXxx` per unit under test (named for it, e.g. `TestUserCreatedService`), containing one `t.Run("description", func(t *testing.T) {...})` per case, each written out individually. See `services/mailer/internal/utilities/get_env_test.go` for the house pattern.
    - Vitest/TS: the same shape — one `describe("UnitUnderTest", () => {...})` containing one `it(...)` per case, each written out individually, not generated from an array.
    - Either way, give each subtest/`it` description a specific, assertion-shaped sentence naming the exact scenario and expected outcome (e.g. `t.Run("returns ErrInvalidEmail when email is empty", ...)`, `it("returns ErrInvalidEmail when email is empty", ...)`), not a generic label like `"invalid input"` or `"case 2"`.
    - The goal: each case reads standalone and its name alone tells you what broke, while still grouping related cases under one named unit — not deduplicating setup via a loop/table.
- **Security & Secrets Handling**:
  - Never read, display, echo, commit, or extract API keys, tokens, passwords, private keys/certificates, or sensitive credentials.
  - Never allow secrets or sensitive user information to be emitted in plaintext, logs, memory files, or persistent records where they could be captured or retained in vendor training datasets.
  - Always use environment variable references (e.g. `.env.example` templates) or sanitized mocks for tests and development.

---

## 5. Agent Verification Checklist Before Proposing Changes

1. **Lint Check**: `npx biome ci app && npx biome ci services` passes without errors. For `services/mailer`, run `go vet ./...` instead (no Biome coverage for Go).
2. **Test Check**: `npx vitest run` in affected packages (`services/common`, `services/authentication`, `services/devicecontrol`, `app`); `go test ./...` in `services/mailer` if touched. Ensure newly proposed easily testable modules have unit tests written and passing.
3. **Build Check**: `npm run build` succeeds in all modified TS service directories; `go build ./...` succeeds in `services/mailer` if touched.
4. **Note**: `.github/workflows/run_tests.yml` currently only runs the TS/Vitest matrix — `services/mailer` isn't wired into CI yet, so steps 1–3 above for Go are on the agent/maintainer to run locally, not something CI will catch.
