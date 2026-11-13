# Collect

Collect lets anyone running a group payment (a class trip, a gift, a club
fee) gather the money into a Wise Jar from a single link. Payers need no app
or account, the organiser's board shows who has paid in real time, and
reminders write themselves in each payer's language.

This repo is the hackathon skeleton: one real vertical slice (create and
list `Collection`s) built as strict Clean Architecture, meant to be the
template the rest of the team copies for every new use case.

## Running it

### Memory mode (default, zero setup)

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. Data lives in a module-level in-memory array for
the lifetime of the dev server — nothing to configure.

### Postgres mode

```bash
cp .env.example .env
# edit .env: DATA_SOURCE=postgres, DATABASE_URL=postgres://...
pnpm db:push   # or: pnpm db:generate && pnpm db:migrate
pnpm dev
```

`DATA_SOURCE` (`memory` | `postgres`, default `memory`) is read once in
`src/infrastructure/di/container.ts` and picks which `CollectionRepository`
implementation gets wired up. Nothing else in the app knows which one is
running.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js dev server / production build / start |
| `pnpm lint` | ESLint |
| `pnpm lint:arch` | dependency-cruiser — fails on any Clean Architecture Dependency Rule violation |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit tests |
| `pnpm check` | all of the above, in order — run this before considering any task done |
| `pnpm format` | Prettier, writes in place |
| `pnpm db:generate` / `db:migrate` / `db:push` | Drizzle migrations (postgres mode) |

## Architecture at a glance

Four concentric rings, each a real folder under `src/`:

- `src/domain` — Entities (`Collection`, value objects `CollectionId`/`Money`,
  domain errors). Zero external imports.
- `src/application` — Use cases (`CreateCollectionInteractor`,
  `ListCollectionsInteractor`) and their ports. Imports only `domain`.
- `src/adapters` — Controllers (Zod validation), Presenters (ViewModels),
  Gateways (`InMemoryCollectionRepository`, `DrizzleCollectionRepository`).
  Imports only `application` and `domain`.
- `src/infrastructure` + `src/app` — Drizzle client/schema, env config, the
  DI composition root (`infrastructure/di/container.ts`), and all Next.js
  code. Server Actions in `src/app/actions.ts` are the **only** entry point
  for mutations and queries from the UI — there's no separate backend.

Dependencies point inward only, and it's enforced, not just agreed on: run

```bash
pnpm lint:arch
```

To see it catch a real violation, open
`src/app/__architecture-violation-fixture.ts`, uncomment the two lines
inside it (an app-layer file importing an interactor directly), and run
`pnpm lint:arch` again — then re-comment them.

Full diagrams and the request-flow sequence: [`docs/architecture.md`](docs/architecture.md).
Why this stack, what we considered instead: [`docs/adr/0001-clean-architecture-with-server-actions.md`](docs/adr/0001-clean-architecture-with-server-actions.md).
Adding your own use case: [`docs/adding-a-feature.md`](docs/adding-a-feature.md).

## Tests

`pnpm test` runs:

- `src/domain/entities/collection.entity.test.ts` — entity invariants
- `src/application/use-cases/collections/*.interactor.test.ts` — both use
  cases, against `InMemoryCollectionRepository` and a fake/spy output port.
  No Next.js, no database.
- `src/adapters/presenters/create-collection.presenter.test.ts` — presenter
  formatting and error mapping
