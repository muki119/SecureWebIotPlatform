# Copilot Instructions for Secure Web IoT Platform

Trust the instructions below as the primary reference for working with this repository. Only perform additional search or exploration if the information is missing or found to be in error.

## Project Overview

- **Purpose**: A secure, microservices-based web IoT management platform allowing users to securely manage and control IoT devices, monitor real-time telemetry, manage domain/role-based access, and maintain audit ledgers.
- **Project context**: A personal project built for learning, fun, and applying knowledge — not academic/coursework, no submission deadline or marking scheme. Favour sound engineering and sensible scope.
- **Languages & Runtimes**: TypeScript (ESNext), Node.js (v22+), React 19.
- **Backend Architecture**: Modular microservices inside an npm workspace (`services/`), communicating over HTTP REST (Express 5), Redis EventBus (`services/eventbus`), Socket.io, and MQTT (EMQX).
- **Databases & Infrastructure**: PostgreSQL (auth, domain, ledger), MongoDB (device states/telemetry), Redis (event bus, cache, socket adapter), EMQX (MQTT broker), Nginx (reverse proxy).
- **Frontend Architecture**: Single Page Application in `app/` using React 19, Vite 7, Tailwind CSS v4, Radix UI, and TanStack React Query.

## Project Layout

- `services/` - Root npm workspace for all backend services:
  - `services/authentication/` - User auth, JWT token bundle, password hashing (Argon2id/scrypt), registration/login.
  - `services/domain/` - Multi-tenant domain management, member roles, and domain-scoped access control.
  - `services/devicecontrol/` - Device registry, capability management, MQTT & Socket.io real-time communication.
  - `services/ledger/` - Centralized audit logging for domain and device actions.
  - `services/common/` - Shared types, middleware (auth, rate limits, error handling), utilities, and OpenTelemetry instrumentation.
  - `services/eventbus/` - Redis-backed publish/subscribe event streaming between microservices.
- `app/` - React frontend SPA (Vite, TypeScript, React Router, Tailwind CSS, Radix UI, TanStack Query).
- `demo/` - Local development compose stack (`compose.yaml`), Nginx reverse proxy configs, and DB initialization scripts.
- `demo_device/` - Node.js IoT device simulator testing device capabilities over MQTT.

## Development & Code Conventions

- **Architecture Pattern**: Model-Controller-Service pattern within each microservice (`src/models/`, `src/controllers/`, `src/services/`, `src/routes/`).
- **Naming Conventions**:
  - File names: `snake_case.ts` (suffixed with purpose outside common, e.g., `user_controller.ts`, `user_service.ts`).
  - Classes & Types: `PascalCase` (interfaces prefixed with `I`, e.g., `IUserPayload`).
  - Exported functions & variables: `PascalCase` or `camelCase`.
  - Constants: `UPPER_SNAKE_CASE`.
- **Imports**: Service packages consume shared packages via workspace aliases `@services/common` and `@services/eventbus`.
- **Commits & PR titles**: Follow the [Conventional Commits](https://www.conventionalcommits.org/) spec (`type(scope): summary`, e.g. `feat(authentication): add refresh token rotation`, `fix(devicecontrol): ...`, `chore`, `docs`, `test`, `ci`, `refactor`). PRs are squash-merged, so the PR title becomes the commit on `main`. These messages drive automated semantic-version bumps and per-service image tags — a wrong or missing type means a release is missed or mis-sized. Use `!` or a `BREAKING CHANGE:` footer for breaking changes. Scope should be the affected service/package name (`authentication`, `domain`, `devicecontrol`, `ledger`, `eventbus`, `common`, `app`).
- **Testing Rule**: If any proposed feature, utility, helper, middleware, validator, or module is easily testable (e.g. pure logic, deterministic functions, transformers, validators, models), always write automated unit/integration tests (`*.test.ts`) covering normal and edge cases using Vitest.
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
```

### 2. Linting and Code Quality (Biome)
The repository standardizes on **Biome** (do NOT use ESLint in `app`):
```bash
# Continuous Integration checks (matches GitHub Actions CI)
npx biome ci app
npx biome ci services

# Fix formatting and lint issues across repo
npx biome check --write
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
```

## Continuous Integration Checklist
Before pushing or opening a PR, ensure:
1. `npx biome ci app && npx biome ci services` passes with zero errors.
2. `npx vitest run` passes in `services/common`, `services/authentication`, and `services/devicecontrol`.
3. `npm run build` succeeds in the touched services and `app`.
