import { describe, expect, it } from 'vitest';
import { createLocalDisbursements } from './local-disbursements';

const CHIP_IN_ID = 'chip-in-1';

const request = {
  requestId: 'bill',
  kind: 'bill' as const,
  recipient: 'Bus company',
  reference: 'Trip',
  amountMinorUnits: 1250,
};

function fixtureStore() {
  const saved = new Map<string, string>();
  return createLocalDisbursements(() => ({
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => {
      saved.set(key, value);
    },
  }));
}

describe('local disbursements stub', () => {
  it('records a disbursement and lists it back', () => {
    const store = fixtureStore();
    const saved = store.add(CHIP_IN_ID, request);
    expect(saved).toMatchObject(request);
    expect(store.list(CHIP_IN_ID)).toEqual([saved]);
  });

  it('is idempotent for a repeated requestId with the same details', () => {
    const store = fixtureStore();
    const first = store.add(CHIP_IN_ID, request);
    const second = store.add(CHIP_IN_ID, request);
    expect(second).toEqual(first);
    expect(store.list(CHIP_IN_ID)).toHaveLength(1);
  });

  it('rejects reusing a requestId with different details', () => {
    const store = fixtureStore();
    store.add(CHIP_IN_ID, request);
    expect(() => store.add(CHIP_IN_ID, { ...request, amountMinorUnits: 1 })).toThrow(
      'already been used',
    );
  });

  it('keeps disbursements scoped per chip-in', () => {
    const store = fixtureStore();
    store.add(CHIP_IN_ID, request);
    store.add('chip-in-2', { ...request, requestId: 'other' });
    expect(store.list(CHIP_IN_ID)).toHaveLength(1);
    expect(store.list('chip-in-2')).toHaveLength(1);
  });
});
