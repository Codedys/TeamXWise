import type { Disbursement, DisbursementRequest } from './collection-dashboard-client';

/**
 * The balance/disbursement feature has no backend at all yet — deliberately stubbed here rather
 * than built against Neon. Kept local-only, same browser, same contract the UI already expects.
 */
const STORAGE_KEY = 'chip-in:local-disbursements:v1';

export function createLocalDisbursements(storage: () => Pick<Storage, 'getItem' | 'setItem'>) {
  function readAll(): Record<string, Disbursement[]> {
    try {
      const raw = storage().getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, Disbursement[]>) : {};
    } catch {
      return {};
    }
  }
  function writeAll(all: Record<string, Disbursement[]>): void {
    try {
      storage().setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      // Blocked/full storage: the UI keeps whatever it already showed for this visit.
    }
  }
  return {
    list(chipInId: string): Disbursement[] {
      return readAll()[chipInId] ?? [];
    },
    add(chipInId: string, request: DisbursementRequest): Disbursement {
      const all = readAll();
      const existing = all[chipInId] ?? [];
      const duplicate = existing.find((item) => item.requestId === request.requestId);
      if (duplicate) {
        const sameDetails =
          duplicate.kind === request.kind &&
          duplicate.amountMinorUnits === request.amountMinorUnits &&
          duplicate.recipient === request.recipient &&
          duplicate.reference === request.reference;
        if (!sameDetails) throw new Error('This payment reference has already been used.');
        return duplicate;
      }
      const disbursement: Disbursement = { ...request, createdAt: Date.now() };
      all[chipInId] = [...existing, disbursement];
      writeAll(all);
      return disbursement;
    },
  };
}

const defaultStore = createLocalDisbursements(() => window.localStorage);
export const listLocalDisbursements = defaultStore.list;
export const addLocalDisbursement = defaultStore.add;
