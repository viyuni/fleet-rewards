# @server/app

Elysia backend package for Guard Plus.

This package contains the admin and user API apps, shared backend modules, Drizzle schema and relations, migrations, seed scripts, and Eden type exports used by the Nuxt apps.

## Structure

- `src/apps/admin`: admin API app, app context, env, and route modules.
- `src/apps/user`: user API app, app context, env, and route modules.
- `src/modules`: reusable backend modules shared by admin and user apps.
- `src/db`: Drizzle client, schema, relations, migrations, and seed helpers.
- `src/utils`: shared backend utilities, errors, logger, and env helpers.
- `src/context.ts`: shared dependency container and Elysia context wiring.
- `src/eden.ts`: exported Eden app types.

## Development

```bash
vpr @server/app#dev:admin
vpr @server/app#dev:user
```

## Validation

```bash
vpr @server/app#typecheck
vpr @server/app#test
```

The package-level check also runs formatting and linting:

```bash
vpr @server/app#check
```

## Database

```bash
vpr @server/app#db:generate
vpr @server/app#db:push
vpr @server/app#seed
```

Use `.env` for local development and `.env.test` for test database commands.
