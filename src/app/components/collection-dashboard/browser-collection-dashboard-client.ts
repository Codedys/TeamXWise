import {
  collectionDashboardSchema,
  type CollectionDashboard,
  type CollectionDashboardClient,
} from './collection-dashboard-client';

import { dashboardModel } from './collection-dashboard-model';
import { dashboardPreferencesSchema, defaultDashboardPreferences } from './dashboard-settings';

const STORAGE_KEY = 'chip-in:collection-dashboards:v1';
export function createBrowserCollectionDashboardClient(options: {
  storage: () => Pick<Storage, 'getItem' | 'setItem'>;
}): CollectionDashboardClient {
  let memory: CollectionDashboard[] = [];
  const listeners = new Set<() => void>();
  let storageBlocked = false;
  function read() {
    if (storageBlocked) return memory;
    try {
      const parsed = collectionDashboardSchema
        .array()
        .safeParse(JSON.parse(options.storage().getItem(STORAGE_KEY) ?? '[]'));
      if (parsed.success) memory = parsed.data;
    } catch {
      /* Storage may be blocked in private browsing. */
    }
    return memory;
  }
  function write() {
    try {
      options.storage().setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch {
      storageBlocked = true; /* The summary remains available during this visit. */
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
        samplePaidCount: null,
        statisticsPriceMinorUnits: collection.priceMinorUnits,
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
    update(collection) {
      const item = read().find((item) => item.id === collection.id);
      if (!item) return;
      item.samplePaidCount ??= Math.max(0, dashboardModel(item).paid - item.paidCount);
      item.statisticsPriceMinorUnits ??= item.priceMinorUnits;
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
      write();
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
