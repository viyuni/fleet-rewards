---
name: backend-architecture
description: Backend architecture rules for this repo's Elysia + Drizzle backend. Use when creating, reviewing, or refactoring code under server/**, especially module routes, context plugins, use cases, repositories, error classes, database transactions, JWT/auth macros, and module boundaries.
---

# Backend Architecture

Use these rules for backend work in this repo. Prefer the current lightweight module style over textbook Clean Architecture ceremony.

## Stack

- Elysia
- Drizzle ORM
- Bun runtime APIs where already used
- Lightweight module architecture

## Core Flow

```txt
Route(index.ts) -> Context(decorate deps) -> UseCase -> Repository -> DB
```

Only add a separate domain layer when business rules become complex enough to justify it. Do not create `domain/`, `application/`, `infra/`, or `presentation/` folders for ordinary modules.

## Module Shape

Use the flat module shape already present in `servers/*/src/modules/*`:

```txt
modules/{module}/
  index.ts       route/plugin entry
  context.ts     dependency wiring and Elysia decoration
  usecase.ts     application flow and transactions
  repository.ts  Drizzle queries and mutations
  model.ts       Drizzle inferred types and local data types
  errors.ts      module-specific AppError classes and error map
```

Small capability modules may expose only the files they need, for example a context-only helper module.

## Shared Server Module Rules

Modules under `servers/shared/src/modules/*` are reusable backend building blocks, not HTTP entrypoints.

Shared modules should:

- Export context factories, use cases, repositories, models, errors, and helpers that can be reused by app servers.
- Add a dedicated package export in `servers/shared/package.json` for each reusable shared module, for example `"./point-type": "./src/modules/point-type/index.ts"`.
- Follow the same lightweight module wrapping style as existing shared modules such as `image`, `jwt`, and `point-type`.
- Accept dependency instances from the caller through function parameters or constructors, for example `pointTypePlugin({ db })` or `imagePlugin({ useCase })`.
- Keep environment-specific choices in the caller, such as `servers/admin` or `servers/user`.

Shared modules must not:

- Create or expose business routes for admin/user apps.
- Import app-specific infrastructure such as `servers/admin/src/db`, `servers/user/src/config`, or app auth guards.
- Decide URL prefixes, route metadata, or app-specific auth policy.
- Instantiate app-specific dependencies when those instances can be passed in by the consuming server.

App servers should wrap shared modules in their own route plugins when an HTTP API is needed:

```ts
export const pointType = new Elysia({ prefix: '/point-types' })
  .use(authGuard)
  .use(pointTypePlugin({ db }))
  .get('/', ({ pointType }) => pointType.list(), { requiredAuth: true });
```

## Route Rules

Routes live in `index.ts`.

Routes should:

- Define Elysia route paths and HTTP schemas.
- Call decorated use cases, for example `({ body, admin }) => admin.login(body)`.
- Use shared request/response schemas from `@internal/shared`.
- Use route metadata such as `details.summary` when useful.
- Use auth macros such as `{ requiredAuth: true }`.

Routes must not:

- Access `db` directly.
- Open transactions.
- Hash passwords, sign tokens, or run multi-step business flow.
- Contain business branching beyond simple request adaptation.

## Shared Schema Rules

Request/response schemas that are used by routes or use cases must live in the shared schema package and be imported from `@internal/shared`.

Routes should import schema values such as `userLoginSchema` from `@internal/shared` and attach them to Elysia route options.

Use cases should import the corresponding input/output types such as `UserLoginInput` from `@internal/shared`.

Repositories should not import shared schemas or shared input types. Convert or pass use case inputs into repository methods whose parameters are typed with local Drizzle-inferred model types.

## Context Rules

Context files own dependency wiring.

Use `context.ts` to:

- Import shared infrastructure such as `db` and `config`.
- Create module dependencies such as `JwtAuthenticator`.
- Install helper plugins/macros with `.use(...)`.
- Register module errors with `.error(ModuleErrors)`.
- Decorate the module use case with `.decorate('moduleKey', new ModuleUseCase(...))`.

Example shape:

```ts
const authenticator = new JwtAuthenticator(config.ADMIN_JWT_SECRET);

export const adminContext = new Elysia({ name: 'AdminContext' })
  .use(jwt({ authenticator }))
  .error(AdminErrors)
  .decorate('admin', new AdminUseCase(db, authenticator));
```

Keep the decoration key camelCase and aligned with route destructuring.

## UseCase Rules

Use one UseCase class per module by default, such as `AdminUseCase` or `UserUseCase`.

UseCases should:

- Accept `DbClient` plus required collaborators through the constructor.
- Own transactions for business actions that write or require consistency.
- Instantiate repositories inside the transaction with `tx`.
- Coordinate repository calls and application services.
- Accept route input types from shared schemas in `@internal/shared`.
- Throw shared or module-specific `AppError` subclasses.
- Return API-ready plain objects when that keeps routes thin.

UseCases may contain application-level operations such as password hashing, credential checks, and token signing when those operations are part of the business action.

Transaction pattern:

```ts
export class AdminUseCase {
  constructor(
    private db: DbClient,
    private authenticator: JwtAuthenticator,
  ) {}

  async login(input: AdminLoginInput) {
    return this.db.transaction(async tx => {
      const adminRepository = new AdminRepository(tx);
      const admin = await adminRepository.findByUsername(input.username);

      // validate, mutate, sign token, return DTO
    });
  }
}
```

Avoid creating separate service classes unless a collaborator has a real independent responsibility, such as `JwtAuthenticator`.

## Repository Rules

Repositories wrap Drizzle access only.

Repositories should:

- Accept `Db` from `@server/shared/db` when importing from app server packages, so they work with both the root client and transaction clients.
- Use Drizzle query builders and schema objects from `@server/shared/db/schemas` when importing from app server packages.
- Use repository parameter types imported from local `model.ts`, where those types are derived with Drizzle `InferSelectModel` and `InferInsertModel`.
- Encapsulate common persistence filters such as `isNull(deletedAt)`.
- Return database records, `null`, or simple persistence results.

Repositories must not:

- Import Elysia, route schemas, config, or JWT/auth code.
- Import request input types from `@internal/shared`; shared schemas are for routes and use cases, not persistence APIs.
- Open transactions.
- Make permission decisions.
- Hash passwords or sign tokens.
- Orchestrate business workflows.

Use `DbClient` only for the root use case dependency. Use `Db` for repository constructors.

Repository write methods should take inferred model types, not hand-written request shapes:

```ts
import type { InsertAdmin, UpdateAdmin } from './model';

export class AdminRepository {
  constructor(private db: Db) {}

  async create(input: InsertAdmin) {
    return this.db.insert(admins).values(input).returning();
  }

  async update(id: string, input: UpdateAdmin) {
    return this.db.update(admins).set(input).where(eq(admins.id, id)).returning();
  }
}
```

## Model Rules

Keep `model.ts` small and close to Drizzle:

```ts
export type Admin = InferSelectModel<typeof admins>;
export type InsertAdmin = InferInsertModel<typeof admins>;
export type UpdateAdmin = Partial<InsertAdmin>;
```

Use these inferred model types for repository parameters and return annotations when explicit annotations are useful.

Do not duplicate shared request schemas in `model.ts`; import request input types from `@internal/shared` in routes and use cases instead.

## Error Rules

Module errors live in `errors.ts`.

Create specific errors by extending shared base errors from `@server/shared/errors` when importing from app server packages, override `code`, and provide a useful Chinese default message when the user-facing API needs one.

```ts
export class AdminDisabledError extends ForbiddenError {
  override code = 'ADMIN_DISABLED';

  constructor(message = '管理员账号已被禁用') {
    super(message);
  }
}

export const AdminErrors = {
  AdminDisabledError,
};
```

Register the error map in `context.ts` with `.error(ModuleErrors)`.

Use shared errors directly for generic cases, for example `InvalidCredentialsError`.

## Auth Rules

Use the JWT module instead of implementing auth in routes.

- Create `JwtAuthenticator` in context with the appropriate secret from `config`.
- Install `jwt({ authenticator })` in the module context.
- Protect routes with `{ requiredAuth: true }`.
- Read the resolved `userId` from route context.

## Transaction Rules

Open transactions in UseCase methods, not routes or repositories.

For multiple repository operations in one business action, create all repositories with the same `tx` inside the transaction callback.

```ts
return this.db.transaction(async tx => {
  const repo = new AdminRepository(tx);
  // all DB writes for this action use repo/tx here
});
```

For cross-module workflows, prefer a higher-level use case that owns one transaction and passes `tx` to repositories. Do not call another use case that opens a nested transaction unless the behavior is intentional and verified.

## Import Rules

For imports that cross workspace package boundaries, prefer real package names:

- `@server/admin`, `@server/user`, and `@server/shared` for server packages.
- `@web/admin`, `@web/user`, and `@web/ui` for web packages.
- `@internal/shared` for shared route schemas and input/output types.

When importing from `@server/shared`, prefer the most specific package export for that module or capability, such as `@server/shared/image`, `@server/shared/jwt`, `@server/shared/point-type`, `@server/shared/db`, or `@server/shared/errors`. Add a new dedicated export before consuming a new reusable shared module from another package.

Use `#...` imports only as TypeScript path aliases for code inside the current project/package, for example `#server/admin/...` inside `@server/admin`, `#server/user/...` inside `@server/user`, or `#server/shared/...` inside `@server/shared`.

Backend examples:

```ts
// Cross-package imports use package names.
import { setupApp } from '@server/shared/setup-app';
import { imagePlugin } from '@server/shared/image';
import { userLoginSchema } from '@internal/shared';
import type { Db } from '@server/shared/db';

// In-package aliases are for local source internals.
import { config } from '#server/admin/config';
```

Do not use `#...` aliases to reach another workspace package when that package has an `@...` package export. Do not use deep relative paths such as `../../shared/src/...` across package boundaries.

Prefer type-only imports for types. Keep local module imports relative.

## Naming

```txt
Route/plugin export: camelCase module name, e.g. admin, user
Context export: {module}Context
UseCase class: {Module}UseCase
Repository class: {Module}Repository
Error class: Specific PascalCase + Error
Decorate key: camelCase module name
Elysia name: PascalCase descriptive name, e.g. AdminContext, UserRoute
```

## Decision Heuristics

- If code is HTTP-specific, keep it in `index.ts`.
- If code wires dependencies or Elysia macros/errors, keep it in `context.ts`.
- If code describes a business action, keep it in `usecase.ts`.
- If code is a Drizzle read/write, keep it in `repository.ts`.
- If code is a database record type, keep it in `model.ts`.
- If code is a reusable business rule with no DB/HTTP dependency, consider a small domain helper only when the use case is becoming hard to read.

## Validation

After backend changes, run the repo's Vite+ commands from the project root:

```txt
vp check
vpr typecheck
vp test
```

Use `vp` commands rather than calling package-manager tools directly.
