# Copilot Instructions for Secure Web IoT Platform

Trust the instructions below as the primary reference for working with this repository. Only perform additional search or exploration if the information is missing or found to be in error.

## Project Overview

- **Purpose**: A secure, microservices-based web IoT management platform allowing users to securely manage and control IoT devices, monitor real-time telemetry, manage domain/role-based access, and maintain audit ledgers.
- **Project context**: A personal project built for learning, fun, and applying knowledge — not academic/coursework, no submission deadline or marking scheme. Favour sound engineering and sensible scope.
- **Languages & Runtimes**: TypeScript (ESNext), Node.js (v22+), React 19, Go (1.27+, `services/mailer`).
- **Backend Architecture**: Modular microservices inside an npm workspace (`services/`), communicating over HTTP REST (Express 5), Redis EventBus (`services/eventbus`), Socket.io, and MQTT (EMQX). `services/mailer` is a separate Go service (own `go.mod`, joined via a `services/go.work` Go workspace file) that consumes the Redis event bus directly to send templated SMTP email — it does not use Express or `@services/common`.
- **Databases & Infrastructure**: PostgreSQL (auth, domain, ledger), MongoDB (device states/telemetry), Redis (event bus, cache, socket adapter), EMQX (MQTT broker), Nginx (reverse proxy).
- **Frontend Architecture**: Single Page Application in `app/` using React 19, Vite 7, Tailwind CSS v4, Radix UI, and TanStack React Query.
- **Observability**: OpenTelemetry throughout, including Go — `services/mailer` exports logs/traces via OTLP-HTTP and metrics via a pull-based Prometheus exporter (`/metrics` on `OTEL_PROMETHEUS_PORT`, default `9464`).

## Project Layout

- `services/` - Root npm workspace for all backend services:
  - `services/authentication/` - User auth, JWT token bundle, password hashing (Argon2id/scrypt), registration/login.
  - `services/domain/` - Multi-tenant domain management, member roles, and domain-scoped access control.
  - `services/devicecontrol/` - Device registry, capability management, MQTT & Socket.io real-time communication.
  - `services/ledger/` - Centralized audit logging for domain and device actions.
  - `services/common/` - Shared types, middleware (auth, rate limits, error handling), utilities, and OpenTelemetry instrumentation.
  - `services/eventbus/` - Redis-backed publish/subscribe event streaming between microservices.
  - `services/mailer/` - Go service (own `go.mod`, `services/go.work` workspace). Consumes the event bus directly and sends templated SMTP email (user created/deleted, password reset). Layout: `cmd/mailer/main.go` entry point; `internal/app/` composition root (event bus + OTel logger/tracer/meter + handler wiring); `internal/handlers/` one file per stream, instrumentation applied via a `WithInstrumentation` decorator at registration, not inside handler bodies; `internal/services/` business logic, with the SMTP sender and template renderer as interface/func-valued fields so tests can fake them; `internal/helpers/` the concrete SMTP client; `internal/templates/` `html/template` email bodies. Interface placement: declare an interface in the package that *consumes* it, not the one that implements it (e.g. `services.IMailer` lives in `services`, not `helpers`, even though `helpers.Mailer` is the concrete type; `handlers.IServices` lives in `handlers`, not `services`) — standard Go idiom, and what lets tests fake dependencies without a mocking library.
- `app/` - React frontend SPA (Vite, TypeScript, React Router, Tailwind CSS, Radix UI, TanStack Query).
- `demo/` - Local development compose stack (`compose.yaml`), Nginx reverse proxy configs, and DB initialization scripts.
- `demo_device/` - Node.js IoT device simulator testing device capabilities over MQTT.

## Development & Code Conventions

- **Architecture Pattern**: Model-Controller-Service pattern within each TS microservice (`src/models/`, `src/controllers/`, `src/services/`, `src/routes/`). `services/mailer` (Go) is event-bus-driven instead and doesn't follow MCS — see its layout above.
- **Naming Conventions**:
  - TS file names: `snake_case.ts` (suffixed with purpose outside common, e.g., `user_controller.ts`, `user_service.ts`). Go files follow the same `snake_case.go` convention.
  - Classes & Types: `PascalCase`. Interfaces prefixed with `I` in both languages (e.g., `IUserPayload` in TS; `IMailer`, `IServices` in the Go mailer service) — consistent with the rest of the codebase, even though idiomatic Go usually skips the prefix.
  - Exported functions & variables: `PascalCase` or `camelCase` (TS); Go uses exported `PascalCase` / unexported `camelCase`.
  - Constants: `UPPER_SNAKE_CASE` in both languages.
- **Imports**: TS service packages consume shared packages via workspace aliases `@services/common` and `@services/eventbus`. `services/mailer` is intentionally standalone — it talks to Redis directly via `github.com/muki119/go-slim-event-bus/v2`, not through `@services/common`.
- **Commits & PR titles**: Follow the [Conventional Commits](https://www.conventionalcommits.org/) spec (`type(scope): summary`, e.g. `feat(authentication): add refresh token rotation`, `fix(devicecontrol): ...`, `chore`, `docs`, `test`, `ci`, `refactor`). PRs are squash-merged, so the PR title becomes the commit on `main` — enforced by `.github/workflows/pr-title.yml` on every PR open/edit. These messages drive automated semantic-version bumps and per-service image tags — a wrong or missing type means a release is missed or mis-sized. Use `!` or a `BREAKING CHANGE:` footer for breaking changes. Scope is optional; when used it's the affected area (`authentication`, `domain`, `devicecontrol`, `ledger`, `eventbus`, `common`, `mailer`, `app`, `demo`, `release`).
- **Testing Rule**: If any proposed feature, utility, helper, middleware, validator, or module is easily testable (e.g. pure logic, deterministic functions, transformers, validators, models), always write automated unit/integration tests covering normal and edge cases: `*.test.ts` with Vitest for TS services, `*_test.go` with `go test` for `services/mailer`. Write each case as its own explicit test, not a parameterized/table-driven one — no `for` loop over a slice of cases, no `it.each([...])`/`test.each([...])`. In Go: one `func TestXxx` per unit under test, containing one `t.Run("description", ...)` per case written out individually (see `services/mailer/internal/utilities/get_env_test.go`). In Vitest/TS: the same shape — one `describe("UnitUnderTest", ...)` containing one `it(...)` per case, each written out individually. Give each subtest/`it` description a specific, assertion-shaped sentence naming the scenario and expected outcome (e.g. `it("returns ErrInvalidEmail when email is empty", ...)`), not a generic label like `"invalid input"`.
- **Security & Secrets Handling**:
  - Never read, display, echo, commit, or extract API keys, tokens, passwords, private certificates, or other sensitive credentials.
  - Never allow secrets or sensitive user information to be emitted in plaintext, logs, memory stores, or persistent records where they could be captured or retained in vendor training data.
  - Always use environment variable references (e.g. `.env.example` templates) or sanitized mocks for tests and development.

## Build, Test, and Quality Commands

### 1. Bootstrapping & Dependencies
Always install dependencies before building or running tests:
```bash
# Install root/services workspace dependencies (links packages)
cd services && npm ci

# Install frontend dependencies
cd app && npm ci

# Go mailer service (deps auto-resolve on build/test; explicit download optional)
cd services/mailer && go mod download
```

### 2. Linting and Code Quality (Biome / go vet)
The repository standardizes on **Biome** for TS/React (do NOT use ESLint in `app`). The Go mailer service has no Biome equivalent — use `go vet` and `gofmt`:
```bash
# Continuous Integration checks (matches GitHub Actions CI)
npx biome ci app
npx biome ci services

# Fix formatting and lint issues across repo
npx biome check --write

# Go mailer service
cd services/mailer && go vet ./...
cd services/mailer && gofmt -l .   # lists any files not gofmt-formatted
```

### 3. Running Tests (Vitest)
> **Crucial**: Run Vitest inside individual package directories. Do not run `npm test` from `services/` root, as relative worker paths in `eventbus` require the package execution context.
```bash
# Shared utilities and helpers
cd services/common && npx vitest run

# EventBus tests (requires Redis on localhost:6379)
cd services/eventbus && npx vitest run

# Authentication service tests
cd services/authentication && npx vitest run

# Device control service tests
cd services/devicecontrol && npx vitest run

# Frontend application tests
cd app && npx vitest run

# Go mailer service tests (go test, not Vitest)
cd services/mailer && go test ./...
```

### 4. Building Services and Frontend
```bash
# Build backend microservices (esbuild bundle to dist/)
cd services/authentication && npm run build
cd services/devicecontrol && npm run build
cd services/domain && npm run build
cd services/ledger && npm run build

# Build frontend application
cd app && npm run build

# Build the Go mailer service
cd services/mailer && go build ./...
```

## Continuous Integration Checklist
Before pushing or opening a PR, ensure:
1. `npx biome ci app && npx biome ci services` passes with zero errors. For `services/mailer`, `go vet ./...` passes instead.
2. `npx vitest run` passes in `services/common`, `services/authentication`, and `services/devicecontrol`; `go test ./...` passes in `services/mailer` if touched.
3. `npm run build` succeeds in the touched TS services and `app`; `go build ./...` succeeds in `services/mailer` if touched.
4. Note: `.github/workflows/run_tests.yml` currently only runs the TS/Vitest matrix — `services/mailer` isn't wired into CI yet, so its checks above are on you to run locally.
