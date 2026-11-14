import {
  collectionDashboardSchema,
  disbursementSchema,
  type CollectionDashboard,
  type CollectionDashboardClient,
} from './collection-dashboard-client';

import { dashboardPreferencesSchema, defaultDashboardPreferences } from './dashboard-settings';

const STORAGE_KEY = 'chip-in:collection-dashboards:v1';
export function createBrowserCollectionDashboardClient(options: {
  storage: () => Pick<Storage, 'getItem' | 'setItem'>;
  now?: () => number;
}): CollectionDashboardClient {
  let memory: CollectionDashboard[] = [];
  const listeners = new Set<() => void>();
  let storageBlocked = false;
  function read() {
    if (storageBlocked) return memory;
    try {
      const raw = JSON.parse(options.storage().getItem(STORAGE_KEY) ?? '[]');
      const parsed = collectionDashboardSchema.array().safeParse(raw);
      if (parsed.success) {
        memory = parsed.data;
        // Persist schema upgrades and discard obsolete sample counts and phone fields.
        if (JSON.stringify(raw) !== JSON.stringify(memory)) {
          options.storage().setItem(STORAGE_KEY, JSON.stringify(memory));
        }
      }
    } catch {
      /* Storage may be blocked in private browsing. */
    }
    return memory;
  }
  function write() {
    try {
      options.storage().setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch {
      storageBlocked = true; /* The owner record remains available during this visit. */
    }
    listeners.forEach((listener) => listener());
  }
  return {
    remember(collection, expiresAt) {
      read();
      if (memory.some((item) => item.id === collection.id)) return;
      memory.push({
        id: collection.id,
        title: collection.title,
        isOpen: collection.isOpen,
        participants: structuredClone(collection.participants),
        payments: [],
        disbursements: [],
        preferences: defaultDashboardPreferences(),
        invitationMessage: collection.invitationMessage,
        audience: collection.audience,
        currency: collection.currency,
        priceMinorUnits: collection.priceMinorUnits,
        deadline: collection.deadline,
        expectedCount: collection.participants.length,
        limitType: collection.limitType,
        spotLimit: collection.spotLimit,
        goalMinorUnits: collection.goalMinorUnits,
        customQuestion: collection.customQuestion,
        paidCount: collection.progress.paidSpots,
        collectedMinorUnits: collection.progress.receivedMinorUnits,
        expiresAt,
        visible: false,
        status: 'active',
      });
      write();
    },
    savePreferences(id, preferences) {
      const validated = dashboardPreferencesSchema.parse(preferences);
      const items = read();
      const item = items.find((item) => item.id === id);
      if (!item) throw new Error('Collection not found.');
      const next = items.map((item) =>
        item.id === id ? { ...item, preferences: validated } : item,
      );
      try {
        options.storage().setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        throw new Error(
          'Could not save dashboard settings. Browser storage is unavailable or full.',
        );
      }
      memory = next;
      storageBlocked = false;
      listeners.forEach((listener) => listener());
    },
    remove(id) {
      const remaining = read().filter((item) => item.id !== id);
      try {
        options.storage().setItem(STORAGE_KEY, JSON.stringify(remaining));
      } catch {
        throw new Error(
          'Browser storage blocked dashboard deletion. Allow site storage and try again.',
        );
      }
      memory = remaining;
      storageBlocked = false;
      listeners.forEach((listener) => listener());
    },
    activate(id) {
      const item = read().find((item) => item.id === id);
      if (!item) throw new Error('Prepare a collection link before finishing.');
      item.visible = true;
      write();
    },
    update(collection, payments) {
      const item = read().find((item) => item.id === collection.id);
      if (!item) return;
      const before = JSON.stringify(item);
      item.title = collection.title;
      item.participants = structuredClone(collection.participants);
      item.expectedCount = collection.participants.length;
      if (payments) item.payments = structuredClone(payments);
      item.isOpen = collection.isOpen;
      item.priceMinorUnits = collection.priceMinorUnits;
      item.deadline = collection.deadline;
      item.limitType = collection.limitType;
      item.spotLimit = collection.spotLimit;
      item.goalMinorUnits = collection.goalMinorUnits;
      item.customQuestion = collection.customQuestion;
      item.invitationMessage = collection.invitationMessage;
      item.paidCount = collection.progress.paidSpots;
      item.collectedMinorUnits = collection.progress.receivedMinorUnits;
      if (JSON.stringify(item) !== before) write();
    },
    disburse(id, request) {
      const validated = disbursementSchema.parse(request);
      const items = read();
      const item = items.find((item) => item.id === id && item.visible);
      if (!item) throw new Error('Collection not found.');
      const existing = item.disbursements.find(
        (payment) => payment.requestId === validated.requestId,
      );
      if (existing) {
        if (
          Object.entries(validated).some(
            ([key, value]) => existing[key as keyof typeof validated] !== value,
          )
        )
          throw new Error('This payment reference has already been used.');
        return structuredClone(existing);
      }
      const available =
        item.collectedMinorUnits -
        item.disbursements.reduce((sum, payment) => sum + payment.amountMinorUnits, 0);
      if (validated.amountMinorUnits > available)
        throw new Error('The amount is higher than your available balance.');
      const payment = { ...validated, createdAt: (options.now ?? Date.now)() };
      const next = items.map((entry) =>
        entry.id === id
          ? { ...entry, disbursements: [...entry.disbursements, payment] }
          : entry,
      );
      try {
        options.storage().setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        throw new Error(
          'Could not save the demo payment. Browser storage is unavailable or full.',
        );
      }
      memory = next;
      storageBlocked = false;
      listeners.forEach((listener) => listener());
      return structuredClone(payment);
    },
    close(id, status) {
      const item = read().find((item) => item.id === id);
      if (item) {
        item.status = status;
        write();
      }
    },
    list: () => structuredClone(read().filter((item) => item.visible)),
    get: (id) =>
      structuredClone(read().find((item) => item.id === id && item.visible) ?? null),
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY || event.key === null) listener();
      };
      if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
      };
    },
  };
}
export const browserCollectionDashboardClient = createBrowserCollectionDashboardClient({
  storage: () => window.localStorage,
});
