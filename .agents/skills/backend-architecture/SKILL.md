---
name: backend-architecture
description: Backend architecture rules for this repo's Elysia + Drizzle backend. Use when creating, reviewing, or refactoring code under server/**, especially module routes, context plugins, use cases, repositories, error classes, database transactions, JWT/auth macros, and module boundaries.
---

# Backend Architecture

Use these rules for backend work in this repo. Prefer the current lightweight module style over textbook Clean Architecture ceremony.

## Stack

- Elysia
- Drizzle ORM
- `@server/db` as the dedicated database workspace package
- Bun runtime APIs where already used
- Lightweight module architecture

## Core Flow

```txt
Route(index.ts) -> App Context(Elysia decorate) -> Shared Context(create deps) -> UseCase -> Repository -> DB
```

Use a small `domain/` folder for reusable business rules, errors, and domain-only types. Keep domain code dependency-light: no Elysia, config, app-local imports, or database client instances.

## Module Shape

Use the folder module shape already present in `servers/shared/src/modules/user`:

```txt
modules/{module}/
  domain/
    {module}.policy.ts
    errors.ts
    types.ts       optional, domain-only derived types
    index.ts       barrel export
  repository/
    {module}.repo.ts
    index.ts       barrel export
  usecase/
    {module}.usecase.ts
    index.ts       barrel export
  index.ts         barrel export for domain, repository, usecase
```

Small capability modules may expose only the folders/files they need. Keep each `index.ts` as a barrel export; do not hide dependency construction in module barrels.

## Shared Server Module Rules

Modules under `servers/shared/src/modules/*` are reusable backend building blocks, not HTTP entrypoints.

Shared modules should:

- Export domain policies, errors, repositories, use cases, and helpers that can be reused by app servers.
- Add a dedicated package export in `servers/shared/package.json` for each reusable shared module when it is consumed across package boundaries.
- Accept dependency instances through constructors or dependency objects.
- Keep environment-specific choices in the caller, such as `servers/admin` or `servers/user`.
- Be wired together from `servers/shared/src/context.ts` via `createAppContext({ db })`, which returns one shared Elysia context plugin for type inference and route reuse.

Shared modules must not:

- Create or expose business routes for admin/user apps.
- Create or export per-module Elysia instances.
- Import app-specific infrastructure such as `servers/admin/src/db`, `servers/user/src/config`, or app auth guards.
- Decide URL prefixes, route metadata, or app-specific auth policy.
- Instantiate app-specific dependencies when those instances can be passed in by the consuming server.

Shared app context owns common dependency initialization and Elysia decoration:

```ts
import type { DbClient } from '@server/db';
import Elysia from 'elysia';

import { UserRepository, UserUseCase } from './modules/user';

export function createAppContext({ db }: { db: DbClient }) {
  const userRepo = new UserRepository(db);
  const userUseCase = new UserUseCase({ userRepo });

  return new Elysia({ name: 'SharedAppContext' }).decorate('user', userUseCase);
}
```

App servers should use the shared context plugin in their own route plugins when an HTTP API is needed.

## Database Package Rules

Database client creation, Drizzle schema definitions, and Drizzle inferred table types live in the dedicated `@server/db` package under `servers/db`.

Use the package exports instead of app-local database internals:

- Import `createDb`, `DbClient`, `DbTransaction`, and `DbExecutor` from `@server/db`.
- Import table objects and Drizzle inferred table types from `@server/db/schema`.
- App packages such as `servers/admin` and `servers/user` may keep a tiny local `db.ts` that calls `createDb(config.DATABASE_URL)`.
- Shared backend modules should accept `DbExecutor`, `DbClient`, or `DbTransaction` from callers instead of importing an app package's `db` singleton.
- Add new tables, enums, relations, and inferred table types in `servers/db/src/schema/*`, and export them from `servers/db/src/schema/index.ts`.

Do not define Drizzle schemas, database clients, or table model types inside `servers/admin`, `servers/user`, or `servers/shared` when they belong to the shared database schema.

## Route Rules

Routes live in app-server module `index.ts` files.

Routes should:

- Define Elysia route paths and HTTP schemas.
- Call decorated use cases, for example `({ body, user }) => user.login(body)`.
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

Repositories should not import shared schemas or shared input types. Convert or pass use case inputs into repository methods whose parameters are typed with local Drizzle-inferred model types. Existing query DTOs may be used temporarily when the local pattern already does so, but do not expand that coupling.

## Context Rules

Context files own dependency wiring.

Use shared `servers/shared/src/context.ts` to:

- Instantiate shared repositories and use cases once per app DB.
- Return one Elysia context plugin that decorates shared use cases such as `user`, `pointType`, and `pointAccount`.
- Pass dependencies via constructors or dependency objects.
- Keep route paths, app-specific auth, and metadata out of shared context.

Use app-server `context.ts` files to:

- Import app-local infrastructure such as `db` and `config`.
- Create app-local dependencies such as `JwtAuthenticator`.
- Install helper plugins/macros with `.use(...)`.
- Register module errors with `.error(ModuleErrors)`.
- Decorate module use cases with `.decorate('moduleKey', useCase)`.
- Reuse shared use cases and repositories from `createAppContext({ db })` when the module depends on shared backend context.

Keep the decoration key camelCase and aligned with route destructuring.

## UseCase Rules

Use one UseCase class per module by default, such as `UserUseCase` or `RewardRuleUseCase`.

UseCases should:

- Accept required collaborators through the constructor, usually as a dependency object.
- Accept `DbClient` only when the use case itself must open transactions or construct repositories.
- Own transactions for business actions that write or require consistency.
- Prefer passing `tx` as the final optional `db` parameter to repositories/use cases inside transactions.
- Instantiate repositories inside a transaction only when a transaction-scoped repository instance is genuinely clearer.
- Receive normal repositories, policies, and cross-module collaborators from a `deps` object; do not instantiate them inside the use case constructor.
- Coordinate repository calls and application services.
- Accept route input types from shared schemas in `@internal/shared`.
- Throw shared or module-specific `AppError` subclasses.
- Return API-ready plain objects when that keeps routes thin.
- Use instance methods only. Do not add static use case methods.
- When a use case method can optionally accept an override `DbExecutor`, place that optional dependency at the end of the parameter list.
- When a method must run inside a transaction, make `tx` the first required parameter and do not provide a root-db default.

UseCases may contain application-level operations such as password hashing, credential checks, and token signing when those operations are part of the business action.

Dependency-object pattern:

```ts
export interface UserUseCaseDeps {
  userRepo: UserRepository;
}

export class UserUseCase {
  constructor(private readonly deps: UserUseCaseDeps) {}

  async requireAvailableById(userId: string, db?: DbExecutor) {
    const user = await this.deps.userRepo.findById(userId, db);
    UserPolicy.assertAvailable(user);
    return user;
  }
}
```

Create the dependency object from shared context:

```ts
export function createAppContext({ db }: { db: DbClient }) {
  const userRepo = new UserRepository(db);

  const userUseCase = new UserUseCase({
    userRepo,
  });

  return new Elysia({ name: 'SharedAppContext' }).decorate('user', userUseCase);
}
```

Transaction pattern:

```ts
export class AdminUseCase {
  constructor(
    private readonly db: DbClient,
    private readonly authenticator: JwtAuthenticator,
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

- Accept `DbExecutor` from `@server/db` when the repository can run against either the root client or a transaction client.
- Accept `DbTransaction` from `@server/db` when the repository must only be used inside a transaction.
- Use Drizzle query builders and schema objects from `@server/db/schema`.
- Use repository parameter types from `@server/db/schema` when those types directly describe table insert/update/select shapes.
- Encapsulate common persistence filters such as `isNull(deletedAt)`.
- Return database records, `null`, or simple persistence results.
- Use instance methods only. Do not add static repository methods.
- Put optional `db` override parameters last and default them to `this.db`, for example `findById(id, db = this.db)`.
- For repository methods that require row locks or transactional consistency, make `tx` the first required parameter, for example `requireByIdForUpdate(tx, id)`.

Repositories must not:

- Import Elysia, route schemas, config, or JWT/auth code.
- Import request input types from `@internal/shared`; shared schemas are for routes and use cases, not persistence APIs.
- Open transactions.
- Make permission decisions.
- Hash passwords or sign tokens.
- Orchestrate business workflows.

Repository write methods should take inferred model types, not hand-written request shapes:

```ts
import type { DbExecutor } from '@server/db';
import { admins, type InsertAdmin, type UpdateAdmin } from '@server/db/schema';
import { eq } from 'drizzle-orm';

export class AdminRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(id: string, db: DbExecutor = this.db) {
    return (await db.query.admins.findFirst({ where: { id } })) ?? null;
  }

  async create(input: InsertAdmin, db: DbExecutor = this.db) {
    const [admin] = await db.insert(admins).values(input).returning();
    return admin ?? null;
  }

  async update(id: string, input: UpdateAdmin, db: DbExecutor = this.db) {
    const [admin] = await db.update(admins).set(input).where(eq(admins.id, id)).returning();
    return admin ?? null;
  }
}
```

Do not call repositories as `AdminRepository.findById(db, id)`. Construct the repository once in context or inside a transaction and call `adminRepo.findById(id, db)`.

## Domain Rules

Domain files contain reusable business rules, policies, errors, and domain-only derived types.

Domain code should:

- Prefer instance methods over static methods.
- Keep pure business logic close to the module, for example `domain/user.policy.ts`.
- Throw module-specific errors from `domain/errors.ts`.
- Accept plain domain/database records and primitive values.
- Export through `domain/index.ts`, then through the module root `index.ts`.

Domain code must not:

- Import Elysia, app config, app-local infrastructure, or route schemas.
- Open transactions or query the database.
- Use static helpers for policies. Construct policies or inject them when needed.

Policy shape:

```ts
export class UserPolicy {
  isAvailable(user: User | null | undefined): user is AvailableUser {
    return user?.status === 'normal';
  }

  assertAvailable(user: User | null | undefined): asserts user is AvailableUser {
    if (!this.isAvailable(user)) {
      throw new UserUnavailableError();
    }
  }
}
```

## Model Rules

Prefer Drizzle inferred table types exported from `@server/db/schema`:

```ts
import type { Admin, InsertAdmin, UpdateAdmin } from '@server/db/schema';
```

Only add module-local types when the module needs types that are not pure database table shapes, such as composed read models, API-ready DTOs owned by the module, or domain aliases. Prefer `domain/types.ts` for domain-only aliases.

Do not duplicate shared request schemas in module-local types; import request input types from `@internal/shared` in routes and use cases instead.

## Error Rules

Shared module errors live in `domain/errors.ts`. App-only module errors may live in the app module's local error file.

Create specific errors by extending shared base errors from `@server/shared/errors`, override `code`, and provide a useful Chinese default message when the user-facing API needs one.

```ts
export class UserUnavailableError extends ForbiddenError {
  override code = 'USER_UNAVAILABLE';

  constructor(message = '用户不可用') {
    super(message);
  }
}

export const UserErrors = {
  UserUnavailableError,
};
```

Register the error map in app-server `context.ts` with `.error(ModuleErrors)`.

Use shared errors directly for generic cases, for example `InvalidCredentialsError`.

## Auth Rules

Use the JWT module instead of implementing auth in routes.

- Create `JwtAuthenticator` in app context with the appropriate secret from `config`.
- Install `authGuard` or the JWT macro module in app context.
- Protect routes with `{ requiredAuth: true }`.
- Read the resolved `userId` from route context.

## Transaction Rules

Open transactions in UseCase methods, not routes or repositories.

For multiple repository operations in one business action, create all repositories with the same `tx` inside the transaction callback or pass `tx` to transaction-only methods as the first required parameter.

```ts
return this.db.transaction(async tx => {
  const repo = new AdminRepository(tx);
  // all DB writes for this action use repo/tx here
});
```

For cross-module workflows, prefer a higher-level use case that owns one transaction and passes `tx` to transaction-only repositories/use cases as the first required parameter. For optional DB overrides on non-locking reads, keep the override parameter last. Do not call another use case that opens a nested transaction unless the behavior is intentional and verified.

## Import Rules

For imports that cross workspace package boundaries, prefer real package names:

- `@server/admin`, `@server/user`, and `@server/shared` for server packages.
- `@server/db` for database client types and client factory.
- `@server/db/schema` for Drizzle tables, enums, relations, and inferred table types.
- `@web/admin`, `@web/user`, and `@web/ui` for web packages.
- `@internal/shared` for shared route schemas and input/output types.

When importing from `@server/shared`, prefer the most specific package export for that module or capability, such as `@server/shared/image`, `@server/shared/jwt`, `@server/shared/user`, or `@server/shared/errors`. Add a new dedicated export before consuming a new reusable shared module from another package.

Use `#...` imports only as TypeScript path aliases for code inside the current project/package, for example `#server/admin/...` inside `@server/admin`, `#server/user/...` inside `@server/user`, or `#server/shared/...` inside `@server/shared`.

Do not use `#...` aliases to reach another workspace package when that package has an `@...` package export. Do not use deep relative paths such as `../../shared/src/...` across package boundaries.

Prefer type-only imports for types. Keep local module imports relative.

## Naming

```txt
Route/plugin export: camelCase module name, e.g. admin, user
Context export: {module}Context
UseCase class: {Module}UseCase
Repository class: {Module}Repository
Policy class: {Module}Policy
Error class: Specific PascalCase + Error
Decorate key: camelCase module name
Elysia name: PascalCase descriptive name, e.g. AdminContext, UserRoute
```

## Decision Heuristics

- If code is HTTP-specific, keep it in the app-server route `index.ts`.
- If code wires Elysia macros/errors/decorations, keep it in app-server `context.ts`.
- If code wires shared repositories/use cases, keep it in `servers/shared/src/context.ts`.
- If code describes a business action, keep it in `usecase/{module}.usecase.ts`.
- If code is a Drizzle read/write, keep it in `repository/{module}.repo.ts`.
- If code is a reusable business rule with no DB/HTTP dependency, keep it in `domain/{module}.policy.ts`.
- If code is a shared module error, keep it in `domain/errors.ts`.

## Validation

After backend changes, run the repo's Vite+ commands from the project root:

```txt
vp check
vpr typecheck
vp test
```

Use `vp`/`vpr` commands rather than calling package-manager tools directly.
