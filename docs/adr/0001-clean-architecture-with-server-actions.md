# ADR 0001: Clean Architecture with Next.js Server Actions, no separate backend

## Status

Accepted

## Context

Collect is a hackathon prototype: organisers create a group payment
Collection and share a link; payers contribute with no account. Judges will
read the code, not just click the demo, so the codebase needs to show
disciplined structure under time pressure, not just a working feature.

We also don't know yet how much the demo will grow in the remaining hours —
more use cases (payments, reminders, multi-language), possibly a second
frontend, possibly swapping the data store. We need a structure that keeps
business rules addressable and testable independent of whatever Next.js
version or Postgres setup we're running against, without the overhead of
standing up and deploying a separate API service in a hackathon timeframe.

## Decision

Use Clean Architecture (Entities → Use Cases → Interface Adapters →
Frameworks & Drivers) implemented as four literal folders
(`domain`, `application`, `adapters`, `infrastructure`), plus a `app`
folder for the Next.js App Router itself. Next.js **Server Actions** are the
only entry point for mutations and queries from the UI — there is no
separate REST/GraphQL backend process.

Each Server Action is a thin wrapper that pulls a Controller out of a single
composition root (`infrastructure/di/container.ts`) and returns a ViewModel.
All business logic lives in `domain` and `application`, which have no
knowledge that Next.js, Zod, or Drizzle exist.

The Dependency Rule (inward-only imports) is enforced by `dependency-cruiser`
(`pnpm lint:arch`), not just convention, so it can't silently rot as more use
cases get copied from the template.

## Alternatives considered

- **Separate Express/Fastify backend + Next.js frontend.** Rejected for this
  prototype: two deployables, two auth boundaries, and CORS/API-contract
  overhead that buys us nothing a hackathon demo needs. Server Actions give
  us a type-safe RPC boundary for free, colocated with the UI that calls it.
- **No layering — read/write Drizzle directly from Server Actions.** Fastest
  to type, but it means business rules (title limits, currency validation,
  target-amount invariants) live wherever a developer happens to be, with no
  seam to unit-test them without a database, and no seam to add a second
  data source or interface later. Rejected because this is exactly the kind
  of code a judge reading quickly should be able to trust at a glance.
- **tRPC instead of raw Server Actions.** Attractive for end-to-end type
  safety, but it's one more dependency and concept for a hackathon team to
  onboard onto, and Server Actions already give us typed calls from Client
  Components without a router layer. Revisit if the project grows a second
  (non-Next) client.

## Consequences

- **Cost:** more files and indirection per use case than a typical Next.js
  CRUD route. `docs/adding-a-feature.md` exists specifically to make that
  cost mechanical rather than a source of inconsistency across the team.
- **Benefit:** `CreateCollectionInteractor` and `ListCollectionsInteractor`
  are unit-tested with zero Next.js, zero database, and zero mocking
  framework — just the in-memory repository and a fake presenter. That is
  the architecture's own proof of correctness, not just a claim in this
  document.
- **Benefit:** swapping `DATA_SOURCE=memory` for `DATA_SOURCE=postgres` is a
  one-line env change, not a rewrite, because `CollectionRepository` is an
  interface the use cases depend on, not a concrete Drizzle call.
- **Risk:** the Drizzle gateway necessarily imports `infrastructure/db/schema.ts`
  and the `drizzle-orm` query builder to do its job, which looks like a
  ring violation at first glance. `docs/architecture.md` documents this as a
  deliberate, narrow exception (schema shape only, never a live client), and
  `.dependency-cruiser.cjs` encodes exactly that exception rather than
  disabling the rule.
