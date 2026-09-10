# AI Agent Guidelines & Repository Knowledge

This document provides essential instructions, architecture maps, and validated commands for autonomous AI coding agents working on the **Secure Web IoT Platform**.

---

## 1. Project Summary & Architecture

The **Secure Web IoT Platform** is a multi-tenant, microservices-based web application for managing and controlling IoT devices securely over MQTT and WebSockets, with domain-scoped RBAC, JWT session management, real-time telemetry, and audit logging.

### Technology Stack
- **Runtimes & Languages**: Node.js (v22+), TypeScript (ESNext), React 19.
- **Backend Architecture**: Microservices inside an npm workspace (`services/`), built with Express 5, OpenTelemetry, Redis pub/sub (`services/eventbus`), Socket.io, and MQTT (EMQX broker).
- **Databases**:
  - **PostgreSQL**: User authentication (`services/authentication`), domains & roles (`services/domain`), and audit logs (`services/ledger`).
  - **MongoDB**: Device metadata, capability states, and telemetry time-series (`services/devicecontrol`).
  - **Redis**: Shared event bus streams, cache, rate-limiting state, and Socket.io cluster adapter.
- **Frontend Architecture**: SPA located in `app/` using Vite 7, React 19, Tailwind CSS v4, Radix UI, TanStack React Query, and Lucide React.
- **Reverse Proxy**: Nginx (`demo/nginx.docker.conf`, `demo/nginx.self.conf`).
- **Code Quality**: Biome (`biome.json`, `app/biome.json`) for unified linting and formatting.

---

## 2. Repository Layout

```
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
├── services/                         # Root npm workspace for backend microservices
│   ├── package.json                  # Workspaces configuration
│   ├── tsconfig.service.json         # Shared TypeScript compiler options
│   ├── authentication/               # User auth, JWT token pairs, Argon2id/scrypt
│   ├── common/                       # Shared models, types, middleware, utils, telemetry
│   ├── devicecontrol/                # Device registry, capability routing, MQTT/Socket.io
│   ├── domain/                       # Multi-tenant domains, members, permissions
│   ├── eventbus/                     # Redis Stream-based inter-service message bus
│   └── ledger/                       # Centralized audit logging service
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
```

### Code Quality & Linting
> **Note**: CI uses **Biome** for linting/formatting (`npx biome ci ...`). While `app/package.json` still contains an ESLint-based `npm run lint` script, Biome is the preferred workflow.
```bash
# CI verification (matches GitHub Actions)
npx biome ci app
npx biome ci services

# Auto-fix formatting and linting errors
npx biome check --write
```

### Running Tests
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
```

---

## 4. Code & Implementation Conventions

- **Model-Controller-Service Pattern**:
  - `src/models/`: Database schema definitions, query logic, and interfaces.
  - `src/controllers/`: Express route request handlers and response formatters.
  - `src/services/`: Core business logic, inter-service calls, and event publishing.
  - `src/routes/`: Route declarations and validation middleware attachments.
- **Naming Conventions**:
  - Files: `snake_case.ts` (e.g. `user_controller.ts`, `device_service.ts`).
  - Classes & Types: `PascalCase`.
  - Interfaces: `PascalCase` prefixed with `I` (e.g. `IUserPayload`, `IDeviceState`).
  - Constants: `UPPER_SNAKE_CASE`.
  - Variables & Parameters: `camelCase`.
- **Shared Package Consumption**:
  - Backend services import shared code via `@services/common` and `@services/eventbus`.
- **Stateless Authentication**:
  - Services verify user identity and roles via JWT tokens and stateless session verification. Avoid introducing cross-service direct database queries.
- **Testing Rule**:
  - If any proposed feature, utility, helper, middleware, validator, or module is easily testable (e.g. pure logic, deterministic functions, transformers, validators, models), always create automated unit/integration tests (`*.test.ts`) covering normal and edge cases using Vitest.
- **Security & Secrets Handling**:
  - Never read, display, echo, commit, or extract API keys, tokens, passwords, private keys/certificates, or sensitive credentials.
  - Never allow secrets or sensitive user information to be emitted in plaintext, logs, memory files, or persistent records where they could be captured or retained in vendor training datasets.
  - Always use environment variable references (e.g. `.env.example` templates) or sanitized mocks for tests and development.

---

## 5. Agent Verification Checklist Before Proposing Changes

1. **Lint Check**: `npx biome ci app && npx biome ci services` passes without errors.
2. **Test Check**: `npx vitest run` in affected packages (`services/common`, `services/authentication`, `services/devicecontrol`, `app`). Ensure newly proposed easily testable modules have unit tests written and passing.
3. **Build Check**: `npm run build` succeeds in all modified service directories.
