# Chip in frontend payment handoff

The owner share screen and `/chip-in/pay/[collectionId]` are frontend demonstrations. They do not publish a public collection or transfer money. There are no provider credentials, card fields, bank accounts, payment APIs, or webhooks in this implementation.

## UI and mock boundary

- `src/app/components/collection-preview/collection-preview-client.ts` defines the frontend response shapes and client interface. These are UI models, not domain entities.
- `browser-collection-preview-client.ts` implements that interface with browser storage and an in-memory fallback. It snapshots validated wizard configuration and preserves demo payment state for unchanged snapshots. Changing collection settings creates a different preview rather than silently changing an old link.
- `collection-sharing/collection-share-panel.tsx` creates a demo snapshot, shows its URL, copies the invitation and shares a QR containing exactly that URL, with a white quiet zone.
- `collection-payment/` contains name selection, checkout and pending/success views. It accepts a `CollectionPreviewClient`, so its UI does not need to import domain entities or repositories.
- The single binding currently selects `browserCollectionPreviewClient`. Replace this with a frontend client that calls the team's server actions and maps adapter presenter ViewModels into the same UI shapes. Keep backend logic out of these components.

Browser storage is local to the current browser and origin. A copied URL or QR does not carry collection names/configuration or work on a different device until the backend can resolve its ID. `localhost` also refers to the scanning device itself. Missing or inaccessible previews show an explanatory state instead of substituting a different collection.

## Client operations to connect

| Frontend operation              | Backend responsibility                                                                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `publish(draft)`                | Authenticated owner creates/publishes a collection and roster, returns its public identifier and presenter ViewModel.                                                                                             |
| `get(id)`                       | Resolve the shared collection and return only the payer-safe settings, names/statuses and availability. Do not expose other payers' contact details or answers.                                                   |
| `quote(id, currency, quantity)` | Create a real, expiring provider quote with final amount, FX rate, fees and supported methods. The current EUR/GBP/USD rates are fixed demo values only.                                                          |
| `submit(request)`               | Validate participant, answers, quantity and collection availability, then initiate provider checkout. Replace demo method selection with actual eligible methods. Bind idempotency to the complete request/quote. |
| `receipt(id, receiptId)`        | Return an appropriately authorised receipt/status for this attempt. Receipt identifiers and return URLs do not prove payment.                                                                                     |
| `subscribe(listener)`           | Refresh statuses through polling, server-sent events or the team's chosen mechanism.                                                                                                                              |
| `confirmBankTransfer(...)`      | Demo control only. Remove from the real client/UI; provider confirmation must come through a verified backend webhook.                                                                                            |

Use the repository's server action → controller → interactor → repository → presenter flow. Move authoritative money, capacity, deadline and payment invariants into domain/application code. Do not import frontend helper rules from the backend.

## Behaviour already demonstrated

- A payer can select an unpaid group participant. Paid/pending names are disabled; name selection is not identity verification.
- A simulated instant payment records success. A bank transfer stays pending until explicitly confirmed in the demo.
- Open-link forms collect the configured name, email and custom answer, and allow paying for more than one person. The demo validates answers and saves them with the local owner payment history.
- Successful quantities consume spots. Failed/pending attempts do not increment successful totals.
- Goals accept full-price contributions and close when reached or exceeded; a batch cannot buy more contributions than necessary to cross the goal.
- Repeated request IDs do not record duplicate successes. Reusing an ID with changed core details is rejected.
- A closing date ends acceptance after that calendar day in the demo's local timezone. Define the collection timezone and closing instant explicitly on the backend.
- Owner share-screen demo counters refresh after a demo payment in the same browser/origin.

The production backend must enforce availability and record contributions atomically, reconcile pending payments, verify provider notifications, and handle concurrent attempts, expiry, failures, retries, refunds and receipt delivery. Client simulations and return-page navigation cannot establish that money was received.

## Validation

Run `pnpm check` and `pnpm build`. Tests cover snapshots, persistence, FX demo arithmetic, duplicate requests, pending confirmation, spot and goal limits, required questions, expiry and blocked browser storage. No real provider calls are needed.

## Temporary preview lifetime and owner dashboards

Payment snapshots now have a fixed `expiresAt` of one hour after publish. Reads and pending bank transfers do not extend it. The browser client physically removes a snapshot, roster and receipts at expiry, or immediately after the final successful group / spots / goal payment. No-limit open links have no payment-count completion condition. A one-second subscriber timer cleans while the UI is open; a closed browser cleans on the next client read (this is not a server background job). Untimed legacy previews are discarded. A final payer retains their confirmation only in the mounted React view; reloading the deleted link cannot restore a receipt.

`collection-dashboard/` is separate from the creation wizard and payment flow. Its browser client keeps the actual collection roster, confirmed/pending demo receipts, question answers, owner settings and local disbursements. Owner **Done** activates this record, clears the creation draft and returns to `/`, where a Chip in card opens `/chip-in/collections/[collectionId]`. Both dashboard modes share progress/balance, people/activity and management columns. Names, quantities, original paid amounts, statuses and charts come from the same local payment data; no fictional contributions, opened-link tracking or unmatched-payment examples are added. Pending transfers never increase collected totals.

The owner record deliberately survives public-token expiry/completion. This now includes names and answers so the owner dashboard remains usable. **Delete** removes that entire owner record plus any surviving payment token and receipts. Older active links can hydrate their owner roster/history from the surviving local snapshot; names already deleted from older expired records cannot be recovered. Missing historical payment dates remain unknown instead of using invented dates. No email address is saved in owner receipts.

Anyone-with-link payers now use details → payment → confirmation. Controlled form state preserves name, email, quantity and answer when returning from payment to details. Fixed groups reuse the same checkout and result components after name selection. The supplied transparent artwork is served unchanged from `public/images/chip-in-success.png`.

Sharing has one **Copy link** action, plus native **Share link** and **Share QR**. QR sharing uses a PNG `File` in the OS share sheet where supported; it never downloads a QR. Unsupported browsers keep the code visible for scanning and explain that the link can be shared. There is no guarantee of cross-device access until the backend and reachable hosting are connected. QR codes contain the URL only. No native share action has been automatically sent to a recipient during testing.

Backend work: enforce expiration and completion atomically on the server, expire tokens with a scheduled cleanup/TTL policy, derive completion only from provider-confirmed payments, expose an authenticated owner dashboard independent of public payment tokens, and apply the agreed data-retention policy to real payment records. Browser-local cleanup is a demo behavior, not a production financial-record retention policy.

## Owner deletion and editable invitations

`deleteCollectionPreview` calls `CollectionPreviewClient.remove(id)` and then `CollectionDashboardClient.remove(id)`. Each removes only the selected collection from its feature storage bucket and notifies subscribers. No `localStorage.clear()` is used. Both methods require a successful storage write before reporting completion; a blocked write leaves the owner a retry path. Deletion is idempotent for expired or already-completed tokens. The dashboard offers a separate confirmation step and returns to the account after deletion. Backend implementations must add owner authorisation and an atomic delete/retention policy.

Review screens share `InvitationMessageEditor`. `invitationMessage: null` means follow the generated suggestion; a string is the user's persisted override. Existing v4 drafts default to automatic text without losing their other fields. Blank overrides cannot publish. Reset restores the current suggestion. Editing only the invitation updates the existing preview and summary without resetting payments or extending its one-hour lifetime. Link sharing includes the edited message and replaces `[link]`; a missing placeholder always adds the URL. Copy link still copies just the URL. QR contains just the URL. No email or message is sent automatically.

## Dashboard panels and finish view

The dashboard now composes shared native `DashboardDialog` modals/drawers: share-card preview, editable copyable reminder templates, open-link settings/co-host display settings, searchable attendee/payment tables, and custom-question answer tables. `dashboard-export` supplies escaped CSV for people and answers. QR remains share-only. Draft email opens a compose window and does not send it. Reminder preview never sends text/email, and co-host names do not grant access.

Preferences use the existing dashboard bucket, with defaults for older summaries. They include editable reminder text templates, co-host names and completion dismissal. The reminder plan, scheduled dates and toggles are removed. Schema migration discards legacy reminder-enabled flags and contact fields without losing edited messages. Reminder buttons copy a complete message with the actual link; clipboard denial exposes a selectable manual-copy field. The user pastes and sends it themselves. No texts or emails are sent automatically. Delete still removes the entire selected summary/preferences plus any surviving public payment record. A completed group opens the filled-jar celebration until the owner returns to the dashboard; Preview finish does not change payments or completion status. Supplied artwork is copied unchanged. Owner and payer success screens share a deterministic two-corner confetti burst and a gentle jar bounce. Confetti plays once on entry and is hidden with reduced motion. Payer confirmation enters vertically from below the viewport, including pending → confirmed bank transfers.

`CollectionPreviewClient.configure` updates a live open-link snapshot in place: pause/reopen, deadline, price for new payments, limit and extra question. It preserves the original one-hour expiry, successful/pending receipts and progress; deleted/expired links cannot be resurrected. Quotes refresh on price changes and submissions include the expected source amount to reject stale displayed prices. The dashboard preserves each settled receipt’s original amount when the price changes. Real atomic edits, owner authorisation, provider quotes, messaging, co-host access, and real statistics remain backend responsibilities. Frontend preferences are stored only in this browser and obey its storage availability/limits.

## Frontend balance actions

Both dashboards and the owner completion view open `DashboardBalancePanel`. It defaults to the available sum, permits a smaller amount, supports a bill recipient/reference or a move to the demo main account, and requires review and confirmation. It never requests real bank credentials or performs a physical cash withdrawal. `CollectionDashboardClient.disburse` records the simulated money-out action durably in the owner bucket, using integer minor units, available-balance validation and idempotent request IDs. A blocked/full storage write leaves the balance unchanged and shows an error. Gross collected totals, contributor progress and goal completion stay unchanged; available balance is gross collected minus saved disbursements. New confirmed contributions increase the available balance. Deletion removes disbursement history together with the dashboard.

Backend handoff: replace this operation with an authenticated payout/bill-payment use case through the existing controller → interactor → repository → presenter flow. Check the real ledger balance atomically, enforce server idempotency and integrate the provider. Client checks and local records are demonstration state only, not an authoritative ledger.

## Shared step icons and visible navigation

`components/icons/wise-check.tsx` uses the unchanged official `Check` SVG path from `@transferwise/icons` 4.8.0, reused by completed wizard steps, audience/limit choices, the no-deadline checkbox and paid participant labels. Attribution and the Apache-2.0 license are in `public/licenses/wise-icons.txt`. No raster screenshot or new runtime dependency is used.

The wizard fits the dynamic viewport; its form body scrolls independently while Back and the next action remain visible. Review uses **Get my link** for both branches, and the final share screen uses **View dashboard** for its destination. **Copy link** sits beside the URL; invitation and preview details expand without pushing navigation off screen. Link publication, copy/share behavior, saved drafts and owner activation are unchanged.

## Mobile presentation

At phone widths (up to 700px), the creation wizard replaces its desktop sidebar with a back button, seven progress segments, a step counter and cancel control. All navigation calls the same validation and draft-update handlers. A full-width bottom action stays outside the scrolling form content. Amount entry, limits, the calendar, names and review cards use a single-column layout.

Payer views reuse the same checkout state and client. Mobile checkout adds a top back button and a bottom bank/card method toggle; returning to details preserves entered values. The primary action remains visible while the form body scrolls. The success view keeps its confetti, jar and actions in a compact green layout, with reduced-motion support unchanged.

Both owner dashboards use a dark mobile summary, the saved people/payment list, and a fixed share/manage action bar. The balance, exports, reminders, QR sharing, settings and delete controls remain available. All totals and names use the existing local data; no extra fixture statistics are introduced. Desktop layouts retain their existing presentation.
