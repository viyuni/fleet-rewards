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
- Use shared schemas from `#shared/schema`.
- Use route metadata such as `details.summary` when useful.
- Use auth macros such as `{ requiredAuth: true }`.

Routes must not:

- Access `db` directly.
- Open transactions.
- Hash passwords, sign tokens, or run multi-step business flow.
- Contain business branching beyond simple request adaptation.

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

- Accept `Db` from `#server/db` so they work with both the root client and transaction clients.
- Use Drizzle query builders and schema objects from `#server/db/schema`.
- Encapsulate common persistence filters such as `isNull(deletedAt)`.
- Return database records, `null`, or simple persistence results.

Repositories must not:

- Import Elysia, route schemas, config, or JWT/auth code.
- Open transactions.
- Make permission decisions.
- Hash passwords or sign tokens.
- Orchestrate business workflows.

Use `DbClient` only for the root use case dependency. Use `Db` for repository constructors.

## Model Rules

Keep `model.ts` small and close to Drizzle:

```ts
export type Admin = InferSelectModel<typeof admins>;
export type InsertAdmin = InferInsertModel<typeof admins>;
export type UpdateAdmin = Partial<InsertAdmin>;
```

Do not duplicate shared request schemas in `model.ts`; import request input types from `#shared/schema`.

## Error Rules

Module errors live in `errors.ts`.

Create specific errors by extending shared base errors from `#server/shared/errors`, override `code`, and provide a useful Chinese default message when the user-facing API needs one.

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

Use existing path aliases:

- `#server/...` for server internals.
- `#shared/...` for shared schemas and types.

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
vp test
```

Use `vp` commands rather than calling package-manager tools directly.
