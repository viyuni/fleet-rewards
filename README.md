<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./webs/base/app/assets/guard-plus-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./webs/base/app/assets/guard-plus-light.png" />
    <img src="./webs/base/app/assets/guard-plus-light.png" alt="Guard Plus" width="230" />
  </picture>
</p>

# Guard Plus

Guard Plus is a Vite+ monorepo for the fleet rewards system. It contains Nuxt web apps, a shared Vue UI package, one Elysia backend package, background queues, and shared TypeScript contracts.

## Packages

- `@server/app` in `server/`: Elysia API apps for admin and user clients, event ingestion, background queues, shared backend modules, Drizzle schema, migrations, and Eden type exports.
- `@internal/shared` in `shared/`: Valibot API schemas, request/response types, and cross-package contracts.
- `@web/admin` in `webs/admin/`: Nuxt admin console.
- `@web/user` in `webs/user/`: Nuxt user-facing app.
- `@web/ui` in `webs/ui/`: shared Vue components, styles, Nuxt module integration, and component metadata.
- `webs/base`: shared static brand assets used by the web apps and documentation.

## Directory Structure

```text
.
├── server/           # @server/app: Elysia apps, event runtime, queues, shared backend modules, DB schema
├── shared/           # @internal/shared: shared schemas and types
├── webs/
│   ├── admin/        # @web/admin: admin Nuxt app
│   ├── base/         # shared brand/static assets
│   ├── user/         # @web/user: user Nuxt app
│   └── ui/           # @web/ui: shared UI package
├── AGENTS.md         # Agent and project workflow notes
├── package.json      # Workspace scripts and package catalog
└── vite.config.ts    # Root Vite+ configuration
```

## Development

Install dependencies and configure hooks:

```bash
vp install
vp config
```

Run checks across the workspace. This formats, lints, and type checks:

```bash
vpr check
```

Run tests across the workspace:

```bash
vpr test
```

Start a specific app or service with its workspace script:

```bash
vpr @server/app#dev:admin
vpr @server/app#dev:user
vpr @server/app#dev:event
vpr @server/app#queue
vpr @web/admin#dev
vpr @web/user#dev
```

Build backend binaries and generated Eden types:

```bash
vpr @server/app#build
vpr @server/app#dts
```

Run targeted type checks:

```bash
vpr tsc
vpr tsc:server
vpr tsc:web
vpr @server/app#typecheck
```

## Backend

The backend package is `@server/app` in `server/`.

- `server/src/apps/admin`: admin API app, admin context, env helpers, and admin-only route modules.
- `server/src/apps/user`: user API app, user context/env, and user-only route modules.
- `server/src/apps/event`: event ingestion runtime.
- `server/src/modules`: reusable backend modules shared by apps and queues.
- `server/src/queues`: Bunqueue job definitions.
- `server/src/db`: Drizzle client, schema, relations, migrations, and seed scripts.
- `server/src/context.ts`: shared dependency container, Elysia context wiring, and event container wiring.
- `server/src/eden.ts`: Eden type export surface consumed by web packages.

Database tasks:

```bash
vpr @server/app#db:generate
vpr @server/app#db:push
vpr @server/app#db:push:test
vpr @server/app#db:seed
vpr @server/app#db:studio
vpr @server/app#db:studio:test
```

Use `.env` for local development commands and `.env.test` for test database commands.

## UI Component Manifest

`@web/ui` exposes components through package subpath exports and a Nuxt component resolver. When adding, removing, or renaming components under `webs/ui/src/components`, run:

```bash
vpr @web/ui#generate:manifest
```

This updates `webs/ui/package.json`, `webs/ui/nuxt/components.json`, and `webs/ui/types.d.ts`.
