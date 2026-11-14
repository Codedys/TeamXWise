import { z } from 'zod';
import { dateFromInput } from '../create-collection/calendar-date';
import {
  amountInMinorUnits,
  invitationPreview,
  emptyCollectionDraft,
  firstInvalidDraftStep,
  COLLECTION_STEP,
  localDateInput,
  type CreateCollectionDraft,
} from '../create-collection/create-collection-draft';
import { evaluateOpenCollection } from '../create-collection/open-collection-rules';
import {
  collectionPreviewSchema,
  paymentReceiptPreviewSchema,
  type CollectionPreview,
  type CollectionPreviewClient,
  type PaymentPreviewRequest,
  type PaymentReceiptPreview,
  type PreviewCurrency,
  type QuotePreview,
} from './collection-preview-client';

import { browserCollectionDashboardClient } from '../collection-dashboard/browser-collection-dashboard-client';
import type { CollectionDashboardClient } from '../collection-dashboard/collection-dashboard-client';

export const PREVIEW_LIFETIME_MS = 60 * 60 * 1000;
const STORAGE_KEY = 'chip-in:collection-previews:v1';
const recordSchema = z.object({
  fingerprint: z.string(),
  expiresAt: z.number().finite(),
  collection: collectionPreviewSchema,
  receipts: z.array(paymentReceiptPreviewSchema),
});
type PreviewRecord = z.infer<typeof recordSchema>;
const DEMO_RATES = { EUR: 1, GBP: 0.87, USD: 1.08 } as const;

export function previewRuleDraft(collection: CollectionPreview): CreateCollectionDraft {
  return {
    ...emptyCollectionDraft(),
    audience: collection.audience,
    amount: (collection.priceMinorUnits / 100).toFixed(2),
    currency: collection.currency,
    deadline: collection.deadline ?? '',
    noDeadline: collection.deadline === null,
    limitType: collection.limitType,
    spotLimit: String(collection.spotLimit),
    goalAmount: (collection.goalMinorUnits / 100).toFixed(2),
  };
}
export function previewClosedReason(
  collection: CollectionPreview,
  today: string,
): string | null {
  if (!collection.isOpen) return 'The organiser has paused this link.';
  if (collection.deadline && today > collection.deadline) return 'This collection has closed.';
  if (collection.audience === 'anyone') {
    const result = evaluateOpenCollection(
      previewRuleDraft(collection),
      collection.progress,
      today,
    );
    if (result.closeReason === 'goal') return 'The goal has been reached. Thank you!';
    if (result.closeReason === 'spots') return 'All spots have been paid for.';
    if (!result.canContribute) return 'This collection is unavailable.';
  }
  return null;
}

/** Browser-only test double: never creates real links, charges money, or contacts a bank. */
export function createBrowserCollectionPreviewClient(options: {
  storage: () => Pick<Storage, 'getItem' | 'setItem'>;
  id: () => string;
  today: () => string;
  now?: () => number;
  dashboards?: CollectionDashboardClient;
}): CollectionPreviewClient {
  const memory = new Map<string, PreviewRecord>();
  const listeners = new Set<() => void>();
  const now = options.now ?? (() => Date.now());
  let storageBlocked = false;
  function persist() {
    try {
      options.storage().setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(memory)));
    } catch {
      storageBlocked = true; /* In-memory preview still works. */
    }
  }
  function completed(collection: CollectionPreview) {
    if (collection.audience === 'group')
      return (
        collection.participants.length > 0 &&
        collection.participants.every((person) => person.status === 'paid')
      );
    return (
      (collection.limitType === 'spots' &&
        collection.progress.paidSpots >= collection.spotLimit) ||
      (collection.limitType === 'goal' &&
        collection.progress.receivedMinorUnits >= collection.goalMinorUnits)
    );
  }
  function prune() {
    let changed = false;
    for (const [id, record] of memory) {
      const complete = completed(record.collection);
      if (complete || now() >= record.expiresAt) {
        options.dashboards?.close(id, complete ? 'complete' : 'expired');
        memory.delete(id);
        changed = true;
      }
    }
    return changed;
  }
  function read() {
    if (storageBlocked) {
      prune();
      return memory;
    }
    let invalid = false;
    try {
      const raw: unknown = JSON.parse(options.storage().getItem(STORAGE_KEY) ?? '{}');
      if (raw && typeof raw === 'object') {
        memory.clear();
        for (const value of Object.values(raw)) {
          const parsed = recordSchema.safeParse(value);
          if (parsed.success) memory.set(parsed.data.collection.id, parsed.data);
          else invalid = true;
        }
      }
    } catch {
      /* Private browsing can keep this demo in memory for the current visit. */
    }
    const removed = prune();
    if (removed || invalid) persist();
    return memory;
  }
  function write(record: PreviewRecord) {
    memory.set(record.collection.id, record);
    options.dashboards?.update(record.collection);
    prune();
    persist();
    listeners.forEach((listener) => listener());
  }
  function requireRecord(id: string) {
    const record = read().get(id);
    if (!record)
      throw new Error(
        'This demo link has expired, is complete, or is not saved in this browser.',
      );
    return record;
  }
  function makeQuote(
    collection: CollectionPreview,
    currency: PreviewCurrency,
    quantity: number,
  ): QuotePreview {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1_000_000)
      throw new Error('Enter a valid number of people.');
    if (!['EUR', 'GBP', 'USD'].includes(currency))
      throw new Error('Choose an available currency.');
    const sourceMinorUnits = collection.priceMinorUnits * quantity;
    const rate = DEMO_RATES[currency] / DEMO_RATES[collection.currency];
    const payMinorUnits = Math.round(sourceMinorUnits * rate);
    if (
      !Number.isSafeInteger(sourceMinorUnits) ||
      !Number.isSafeInteger(payMinorUnits) ||
      payMinorUnits < 1
    )
      throw new Error('This demo cannot quote that amount.');
    return {
      sourceMinorUnits,
      sourceCurrency: collection.currency,
      payMinorUnits,
      payCurrency: currency,
      rate,
    };
  }
  function ensureAvailable(
    record: PreviewRecord,
    quantity: number,
    participantId: string | null,
    pendingReceiptId?: string,
  ) {
    const { collection } = record;
    const closed = previewClosedReason(collection, options.today());
    if (closed) throw new Error(closed);
    if (collection.audience === 'group') {
      const person = collection.participants.find((p) => p.id === participantId);
      const ownsPending = record.receipts.some(
        (r) =>
          r.id === pendingReceiptId &&
          r.participantId === participantId &&
          r.status === 'pending',
      );
      if (!person || quantity !== 1) throw new Error('Choose one name from the list.');
      if (person.status === 'paid') throw new Error('This person has already paid.');
      if (person.status === 'pending' && !ownsPending)
        throw new Error('A transfer is already pending for this person.');
    } else if (
      !evaluateOpenCollection(
        previewRuleDraft(collection),
        collection.progress,
        options.today(),
        quantity,
      ).canContribute
    ) {
      throw new Error('There is not enough remaining capacity for that many people.');
    }
  }
  function markPaid(record: PreviewRecord, receipt: PaymentReceiptPreview) {
    receipt.status = 'paid';
    record.collection.progress.paidSpots += receipt.quantity;
    record.collection.progress.receivedMinorUnits += receipt.sourceMinorUnits;
    const person = record.collection.participants.find((p) => p.id === receipt.participantId);
    if (person) person.status = 'paid';
  }
  return {
    async publish(draft) {
      const invalid = firstInvalidDraftStep(draft, COLLECTION_STEP.share, options.today());
      if (invalid)
        throw new Error(Object.values(invalid.errors)[0] ?? 'Check the collection settings.');
      const config = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        ownerName: 'John Doe',
        invitationMessage: invitationPreview(draft),
        audience: draft.audience,
        currency: draft.currency,
        priceMinorUnits: amountInMinorUnits(draft.amount)!,
        deadline: draft.noDeadline ? null : draft.deadline,
        limitType: draft.limitType,
        spotLimit: Number(draft.spotLimit) || 80,
        goalMinorUnits: amountInMinorUnits(draft.goalAmount) ?? 120000,
        collectEmail: draft.audience === 'anyone' && draft.collectEmail,
        customQuestion:
          draft.audience === 'anyone' && draft.customQuestionEnabled
            ? draft.customQuestion.trim()
            : null,
        names: draft.audience === 'group' ? draft.names.map((name) => name.trim()) : [],
      };
      const fingerprint = JSON.stringify({ ...config, invitationMessage: undefined });
      const existing = [...read().values()].find(
        (record) => record.fingerprint === fingerprint,
      );
      if (existing) {
        existing.collection.invitationMessage = config.invitationMessage;
        write(existing);
        return structuredClone(existing.collection);
      }
      const { names, ...settings } = config;
      const collection: CollectionPreview = {
        ...settings,
        isOpen: true,
        id: options.id(),
        participants: names.map((name) => ({ id: options.id(), name, status: 'unpaid' })),
        progress: { paidSpots: 0, receivedMinorUnits: 0 },
      };
      const expiresAt = now() + PREVIEW_LIFETIME_MS;
      options.dashboards?.remember(collection, expiresAt);
      write({ fingerprint, collection, receipts: [], expiresAt });
      return structuredClone(collection);
    },
    async configure(id, settings) {
      const record = requireRecord(id);
      if (record.collection.audience !== 'anyone')
        throw new Error('Link settings are only available for open collections.');
      const parsed = collectionPreviewSchema.parse({
        ...record.collection,
        isOpen: settings.isOpen,
        deadline: settings.deadline,
        priceMinorUnits: settings.priceMinorUnits,
        limitType: settings.limitType,
        spotLimit: settings.spotLimit,
        goalMinorUnits: settings.goalMinorUnits,
        customQuestion: settings.customQuestion,
      });
      if (parsed.priceMinorUnits < record.collection.priceMinorUnits)
        throw new Error('The price can only be raised for new payers.');
      if (
        parsed.deadline &&
        (!dateFromInput(parsed.deadline) || parsed.deadline < options.today())
      )
        throw new Error('Choose today or a later closing date.');
      if (parsed.limitType === 'spots' && parsed.spotLimit <= parsed.progress.paidSpots)
        throw new Error('Leave at least one spot beyond the people who have already paid.');
      if (
        parsed.limitType === 'goal' &&
        parsed.goalMinorUnits <= parsed.progress.receivedMinorUnits
      )
        throw new Error('The goal must be above the amount already collected.');
      // Do not change creation expiry, settled receipts, names, or progress.
      let fingerprint = `edited:${record.collection.id}`;
      try {
        const original: unknown = JSON.parse(record.fingerprint);
        if (original && typeof original === 'object' && !Array.isArray(original))
          fingerprint = JSON.stringify({
            ...original,
            deadline: parsed.deadline,
            priceMinorUnits: parsed.priceMinorUnits,
            limitType: parsed.limitType,
            spotLimit: parsed.spotLimit,
            goalMinorUnits: parsed.goalMinorUnits,
            customQuestion: parsed.customQuestion,
          });
      } catch {
        /* An old malformed fingerprint must not match a different creation draft. */
      }
      const next = { ...record, collection: parsed, fingerprint };
      const records = new Map(read());
      if (!records.has(id)) throw new Error('This demo link has expired.');
      records.set(id, next);
      try {
        options.storage().setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(records)));
      } catch {
        throw new Error(
          'Could not save link settings. Browser storage is unavailable or full.',
        );
      }
      memory.clear();
      records.forEach((value, key) => memory.set(key, value));
      storageBlocked = false;
      options.dashboards?.update(parsed);
      listeners.forEach((listener) => listener());
      return structuredClone(parsed);
    },
    async remove(id) {
      const remaining = new Map(read());
      remaining.delete(id);
      // A successful delete must be durable, even after a previous quota failure.
      // Keep the current view intact if the browser refuses the write.
      try {
        options.storage().setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(remaining)));
      } catch {
        throw new Error('Browser storage blocked deletion. Allow site storage and try again.');
      }
      memory.clear();
      remaining.forEach((record, key) => memory.set(key, record));
      storageBlocked = false;
      listeners.forEach((listener) => listener());
    },
    async get(id) {
      return structuredClone(read().get(id)?.collection ?? null);
    },
    async quote(id, currency, quantity) {
      return makeQuote(requireRecord(id).collection, currency, quantity);
    },
    async submit(request: PaymentPreviewRequest) {
      const record = requireRecord(request.collectionId);
      const existing = record.receipts.find((r) => r.requestId === request.requestId);
      if (existing) {
        if (
          existing.participantId !== (request.participantId ?? null) ||
          existing.quantity !== request.quantity ||
          existing.payCurrency !== request.currency ||
          existing.method !== request.method ||
          (record.collection.audience === 'anyone' &&
            existing.payerName !== request.payerName.trim())
        )
          throw new Error('This demo request was already used with different details.');
        return structuredClone(existing);
      }
      if (!['instant', 'bank'].includes(request.method))
        throw new Error('Choose a demo payment method.');
      if (!request.requestId || request.requestId.length > 120)
        throw new Error('Invalid demo payment request.');
      ensureAvailable(record, request.quantity, request.participantId ?? null);
      const { collection } = record;
      if (
        request.expectedSourceMinorUnits !== undefined &&
        request.expectedSourceMinorUnits !== collection.priceMinorUnits * request.quantity
      )
        throw new Error('The price changed. Review the updated quote before paying.');
      const payerName =
        collection.audience === 'group'
          ? collection.participants.find((p) => p.id === request.participantId)!.name
          : request.payerName.trim();
      if (!payerName || payerName.length > 100)
        throw new Error('Enter a name of up to 100 characters.');
      if (
        collection.collectEmail &&
        (request.email.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email.trim()))
      )
        throw new Error('Enter a valid email address.');
      if (
        collection.customQuestion &&
        (!request.answer.trim() || request.answer.length > 1000)
      )
        throw new Error('Answer the organiser’s question to continue.');
      const quote = makeQuote(collection, request.currency, request.quantity);
      const receipt: PaymentReceiptPreview = {
        id: options.id(),
        requestId: request.requestId,
        participantId: request.participantId ?? null,
        payerName,
        quantity: request.quantity,
        ...quote,
        method: request.method,
        status: 'pending',
      };
      record.receipts.push(receipt);
      if (request.method === 'instant') markPaid(record, receipt);
      else {
        const person = collection.participants.find((p) => p.id === request.participantId);
        if (person) person.status = 'pending';
      }
      write(record);
      return structuredClone(receipt);
    },
    async receipt(id, receiptId) {
      return structuredClone(
        requireRecord(id).receipts.find((r) => r.id === receiptId) ?? null,
      );
    },
    async confirmBankTransfer(id, receiptId) {
      const record = requireRecord(id);
      const receipt = record.receipts.find((r) => r.id === receiptId);
      if (!receipt) throw new Error('Demo transfer not found.');
      if (receipt.status === 'paid') return structuredClone(receipt);
      ensureAvailable(record, receipt.quantity, receipt.participantId, receipt.id);
      markPaid(record, receipt);
      write(record);
      return structuredClone(receipt);
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY || event.key === null) listener();
      };
      const timer =
        typeof window !== 'undefined'
          ? window.setInterval(() => {
              // Also clean while a page stays open. Closed browsers clean on their next visit.
              const before = [...memory.keys()].join(',');
              read();
              if (before !== [...memory.keys()].join(',')) listener();
            }, 1000)
          : null;
      if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        if (timer !== null) window.clearInterval(timer);
        if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
      };
    },
  };
}
export const browserCollectionPreviewClient = createBrowserCollectionPreviewClient({
  storage: () => window.localStorage,
  id: () => crypto.randomUUID(),
  today: () => localDateInput(),
  now: () => Date.now(),
  dashboards: browserCollectionDashboardClient,
});
