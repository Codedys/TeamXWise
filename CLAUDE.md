# CLAUDE.md

This is a hackathon prototype built as strict Clean Architecture. Judges read
the code, so structural discipline matters as much as features. Follow the
rules below for every change in this repo.

## Folder map → ring

```
src/
  domain/         # 🟡 Entities: Enterprise Business Rules
    entities/
    value-objects/
    errors/
  application/    # 🔴 Use Cases: Application Business Rules
    use-cases/<feature>/<action>.interactor.ts
    ports/input/        # input port interfaces + request DTOs
    ports/output/       # output port (presenter) interfaces + response DTOs
    ports/repositories/ # gateway interfaces
  adapters/       # 🟢 Interface Adapters
    controllers/    # zod validation → request DTO → input port
    presenters/     # output port impl → ViewModel
    gateways/       # repository impl: InMemory<Entity>Repository, Drizzle<Entity>Repository
  infrastructure/ # 🔵 Frameworks & Drivers
    db/             # drizzle client, schema, migrations
    config/         # env parsing (zod)
    di/container.ts # composition root — the ONLY place concrete classes are wired
  app/            # 🔵 Next.js: pages, layouts, components, server actions
```

## The Dependency Rule

Imports point inward only:

- `domain` imports nothing outside itself. No Next, no Zod, no Drizzle, no `process.env`.
- `application` imports only `domain`.
- `adapters` imports only `application` and `domain` — except a Gateway may
  import `infrastructure/db/schema.ts` (table shape) and the driver package
  it wraps (`drizzle-orm`), but never a live client, env config, or the
  container. The client is always constructor-injected.
- `infrastructure` may import any inner ring.
- `app/` imports only `infrastructure/di` (for controllers) and adapter
  ViewModel types (presenters). Never use cases, entities, ports, or
  repositories directly.

**Never import inward-ring code into an outer ring in the wrong direction;
run `pnpm check` before finishing any task.**

`pnpm lint:arch` (dependency-cruiser, config in `.dependency-cruiser.cjs`)
enforces this automatically. If it fails, fix the import direction — don't
weaken the rule. See `docs/architecture.md` for the full rationale,
including the narrow Gateway→schema exception, and
`src/app/__architecture-violation-fixture.ts` for a live example of a
violation it catches.

## Request flow

Server Action (thin, `'use server'`) → Controller (zod validate → request
DTO) → Interactor/Input Port (entities + repository, then calls Output Port)
→ Presenter/Output Port (DTO or `DomainError` → ViewModel) → UI (ViewModel
only, never an entity).

## Principles

- SOLID: one use case per interactor, depend on port interfaces, small
  interfaces, constructor injection everywhere, manual DI only in
  `infrastructure/di/container.ts` (no DI framework, no service locator
  elsewhere).
- Entities validate their own invariants via `static create(...)` factories
  that throw typed `DomainError`s — never construct one with a bare
  constructor from outside the entity.
- Use value objects for IDs and constrained primitives (see `CollectionId`,
  `Money`) instead of raw strings/numbers.
- No `any`. No dead code. No premature abstraction beyond what the current
  use case needs.

## Adding a feature

Follow `docs/adding-a-feature.md` in order: entity → port → interactor →
test → gateway → presenter → controller → container → server action → UI.
Writing the interactor test before the gateway is deliberate — it's what
proves the use case is correct without Next.js or a database.

## Commands

- `pnpm dev` — run locally (defaults to `DATA_SOURCE=memory`, zero setup)
- `pnpm check` — lint + lint:arch + typecheck + test; run before finishing any task
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push` — Drizzle migrations (postgres mode)
