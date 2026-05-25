<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./webs/base/app/assets/guard-plus-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./webs/base/app/assets/guard-plus-light.png" />
    <img src="./webs/base/app/assets/guard-plus-light.png" alt="Guard Plus" width="230" />
  </picture>
</p>

# Guard Plus

Guard Plus is a Vite+ monorepo for the fleet rewards system. It contains Nuxt web apps, a shared Vue UI package, one Elysia backend package, and shared TypeScript contracts.

## Packages

- `@server/app` in `server/`: Elysia API apps for admin and user clients, shared backend modules, Drizzle schema, migrations, and Eden type exports.
- `@internal/shared` in `shared/`: Valibot API schemas, request/response types, and cross-package contracts.
- `@web/admin` in `webs/admin/`: Nuxt admin console.
- `@web/user` in `webs/user/`: Nuxt user-facing app.
- `@web/ui` in `webs/ui/`: shared Vue components, styles, Nuxt module integration, and component metadata.

## Directory Structure

```text
.
├── server/           # @server/app: Elysia apps, shared backend modules, DB schema
├── shared/           # @internal/shared: shared schemas and types
├── webs/
│   ├── admin/        # @web/admin: admin Nuxt app
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

Run checks across the workspace:

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
vpr @web/admin#dev
vpr @web/user#dev
```

## UI Component Manifest

`@web/ui` exposes components through package subpath exports and a Nuxt component resolver. When adding, removing, or renaming components under `webs/ui/src/components`, run:

```bash
vpr @web/ui#generate:manifest
```

This updates `webs/ui/package.json`, `webs/ui/nuxt/components.json`, and `webs/ui/types.d.ts`.
