# Guard Rewards

Guard Rewards is a Vite+ monorepo for the fleet rewards system. It contains Vue web apps, shared UI components, Elysia backend services, and shared TypeScript contracts.

## Features

- Admin and user-facing Vue applications powered by Vite+.
- Shared `@web/ui` component library with Tailwind CSS, Reka UI, shadcn-vue patterns, and an auto-import component resolver.
- Admin and user Elysia server workspaces with Eden client exports.
- Shared backend infrastructure for config, database access, schema, errors, JWT, image handling, and app setup.
- Shared cross-package TypeScript schema and types in `@internal/shared`.

## Directory Structure

```text
.
├── webs/
│   ├── admin/        # Admin Vue app
│   ├── user/         # User Vue app
│   └── ui/           # Shared UI package (@web/ui)
├── servers/
│   ├── admin/        # Admin Elysia API package
│   ├── user/         # User Elysia API package
│   └── shared/       # Shared backend modules and infrastructure
├── shared/           # Shared contracts and schema package
├── AGENTS.md         # Agent and project workflow notes
├── package.json      # Workspace scripts and package catalog
└── vite.config.ts    # Root Vite+ configuration
```

## UI Component Metadata

`@web/ui` exposes components through package subpath exports and an `unplugin-vue-components` resolver.

When adding, removing, or renaming components under `webs/ui/src/components`, run:

```bash
vp run generate:component-meta
```

This updates:

- `webs/ui/package.json` component exports
- `webs/ui/resolver/components.json`
- `webs/ui/types.d.ts`

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

Run type checks across the workspace:

```bash
vpr typecheck
```

Start a specific app or service with its workspace script, for example:

```bash
vpr @web/admin#dev
vpr @web/user#dev
vpr @server/admin#dev
vpr @server/user#dev
```
