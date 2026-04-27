---
name: backend-architecture
description: Backend architecture rules for this repo's Elysia + Drizzle + lightweight Clean Architecture backend. Use when creating, reviewing, or refactoring code in /server, especially routes, use cases, domain rules, repositories, database transactions, and module boundaries.
---

# Backend Architecture

Use these rules when working on backend code in this repo.

## Stack

- Elysia
- Drizzle ORM
- Lightweight Clean Architecture

## Core Flow

```txt
Route -> UseCase -> Domain -> Repository -> DB
```

## Layer Responsibilities

```txt
presentation/
  HTTP concerns, parameter validation, auth
  Do not write business logic

application/
  UseCase business actions
  Own transactions
  Orchestrate flow

domain/
  Business rules
  No DB or HTTP dependencies

infra/
  Repository implementations
  Database operations
```

## Directory Shape

```txt
modules/{module}/
  domain/
  infra/
  application/
  presentation/
```

## Naming

```txt
Class: PascalCase
Instance: camelCase
Context key: camelCase
```

```ts
class GrantPointsUseCase {}

.decorate('points', {
  grant: new GrantPointsUseCase(db),
})
```

## UseCase Rules

Use a UseCase for one complete business action:

```txt
GrantPointsUseCase
ConvertPointsUseCase
HandleMemberEventUseCase
```

UseCases must:

- Control transactions.
- Call repositories.
- Call domain rules or services.

```ts
export class GrantPointsUseCase {
  constructor(private db: DbClient) {}

  async execute(input) {
    return this.db.transaction(async tx => {
      const repo = new PointRepository(tx)

      await repo.increaseBalance(...)
      await repo.createLedger(...)
    })
  }
}
```

## Repository Rules

Repositories only handle:

- Query
- Insert
- Update
- Delete

Repositories must not handle:

- Business logic
- Permissions
- Transactions

## Domain Rules

Domain code can include:

- Policy
- Calculator
- Domain Service
- Error

```ts
export class PointPolicy {
  static assertPositiveAmount(amount: number) {
    if (amount <= 0) throw new Error();
  }
}
```

## Route Rules

Routes only handle:

- HTTP
- Parameter validation
- Auth
- UseCase calls

Routes must not:

- Write business logic
- Access DB directly
- Open transactions

## Plugin Pattern

```ts
export function createPointPlugin(db: DbClient) {
  return new Elysia().decorate('points', {
    grant: new GrantPointsUseCase(db),
    convert: new ConvertPointsUseCase(db),
  });
}
```

## Transaction Rules

For a single UseCase:

```txt
Open the transaction inside the UseCase.
```

For cross-UseCase work:

```txt
Create a higher-level UseCase that owns one unified transaction.
```

Never use the global DB client inside a transaction. Pass and use the transaction client.

## Service Rules

UseCases replace traditional services.

Only use a Domain Service for:

- Complex business rules
- Pure calculation logic

## Logic Ownership

```txt
Parameter validation -> Route / UseCase
Permission checks -> Route
Business rules -> Domain
Database operations -> Repository
Transactions -> UseCase
```

## Final Principle

```txt
UseCase = flow
Domain = rules
Repository = data
Route = entry point
```

## Scope

```txt
server/**
```
