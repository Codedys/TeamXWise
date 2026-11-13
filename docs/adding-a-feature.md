# Adding a feature

Follow this order for every new use case. It mirrors how data actually flows
(see `docs/architecture.md`), so each step only ever needs the step before
it to exist.

Example below adds a hypothetical `RecordPayment` use case on a `Payment`
entity. Swap in your own entity/action names.

1. **Entity** (`src/domain/entities/payment.entity.ts`) — add the entity (and
   any new value objects in `src/domain/value-objects`, errors in
   `src/domain/errors`). Give it a `static create(...)` factory that
   validates invariants and throws a typed `DomainError`. No imports outside
   `src/domain`.

2. **Port** — add the three port files under `src/application/ports/`:
   - `repositories/payment.repository.ts` if this is a new aggregate (skip if
     reusing an existing repository).
   - `input/record-payment.input-port.ts` — the request DTO + input port
     interface.
   - `output/record-payment.output-port.ts` — the response DTO + output port
     interface.

3. **Interactor** (`src/application/use-cases/payments/record-payment.interactor.ts`)
   — implements the input port. Constructor takes the repository and the
   output port. `execute()` builds/loads entities, calls the repository,
   catches `DomainError` and routes it to `outputPort.presentError`,
   otherwise calls `outputPort.presentSuccess`. One interactor per use case.

4. **Test** (`...interactor.test.ts`, next to the interactor) — write it now,
   before the gateway exists, using `InMemoryPaymentRepository` (write a
   minimal one if it doesn't exist yet) and a fake/spy output port. This is
   the step that proves the use case is correct independent of Next.js or
   Postgres.

5. **Gateway(s)** (`src/adapters/gateways/`) — `InMemoryPaymentRepository`
   and `DrizzlePaymentRepository`, both implementing the repository port from
   step 2. Add the Drizzle table to `src/infrastructure/db/schema.ts` first;
   the gateway is the only adapter allowed to import that schema file.

6. **Presenter** (`src/adapters/presenters/record-payment.presenter.ts`) —
   implements the output port, holds a `viewModel` field, formats the
   response DTO (or `DomainError`) into a UI-friendly `ViewModel` type.

7. **Controller** (`src/adapters/controllers/record-payment.controller.ts`) —
   a Zod schema for the raw input, a `handle(rawInput)` method that parses,
   builds the request DTO (including any adapter-generated fields like IDs or
   timestamps), calls the input port, and returns `presenter.viewModel`.

8. **Container** (`src/infrastructure/di/container.ts`) — add
   `getRecordPaymentController()`: build a fresh presenter + interactor +
   controller per call (see architecture doc for why), reusing the singleton
   repository.

9. **Server Action** (`src/app/actions.ts`) — a thin `'use server'` function
   that pulls raw input from `FormData` (or arguments), calls
   `getRecordPaymentController().handle(...)`, and returns the ViewModel.
   Call `revalidatePath` here if another page's data needs to reflect this
   mutation.

10. **UI** (`src/app/components/`) — a component that calls the Server Action
    (typically via `useActionState` for a form) and renders the ViewModel.
    Components never import entities, interactors, or repositories — only
    ViewModel types and the action.

Finish with `pnpm check`. If `lint:arch` fails, you've imported something
from the wrong ring — re-read the rule it names in `.dependency-cruiser.cjs`
and fix the import direction rather than the rule.
