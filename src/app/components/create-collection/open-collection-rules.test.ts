import { describe, expect, it } from 'vitest';
import {
  emptyCollectionDraft,
  type CreateCollectionDraft,
} from './create-collection-draft';
import { evaluateOpenCollection } from './open-collection-rules';

const TODAY = '2026-11-14';
const draft = (changes: Partial<CreateCollectionDraft> = {}): CreateCollectionDraft => ({
  ...emptyCollectionDraft(),
  audience: 'anyone',
  amount: '15',
  noDeadline: true,
  ...changes,
});
const progress = (paidSpots = 0, receivedMinorUnits = paidSpots * 1500) => ({
  paidSpots,
  receivedMinorUnits,
});

describe('open collection frontend capacity rules', () => {
  it('allows unlimited contributions with no limit or closing date', () => {
    expect(evaluateOpenCollection(draft(), progress(100_000), TODAY, 100)).toMatchObject({
      canContribute: true,
      remainingSpots: null,
      closeReason: null,
      maximumReceivableMinorUnits: null,
    });
  });
  it('closes no-limit collections after the chosen day, including month/year changes', () => {
    const collection = draft({ noDeadline: false, deadline: '2026-11-28' });
    expect(
      evaluateOpenCollection(collection, progress(), '2026-11-28').canContribute,
    ).toBe(true);
    expect(evaluateOpenCollection(collection, progress(), '2026-11-29')).toMatchObject({
      canContribute: false,
      closeReason: 'date',
    });
    expect(
      evaluateOpenCollection(collection, progress(), '2027-01-01').canContribute,
    ).toBe(false);
  });
  it('counts each paid-for friend as a spot and rejects a batch larger than the remaining capacity', () => {
    const collection = draft({ limitType: 'spots', spotLimit: '80' });
    expect(evaluateOpenCollection(collection, progress(78), TODAY, 2)).toMatchObject({
      canContribute: true,
      remainingSpots: 2,
      maximumReceivableMinorUnits: 120000,
    });
    expect(evaluateOpenCollection(collection, progress(78), TODAY, 3).canContribute).toBe(
      false,
    );
    expect(evaluateOpenCollection(collection, progress(80), TODAY)).toMatchObject({
      canContribute: false,
      remainingSpots: 0,
      closeReason: 'spots',
    });
    expect(evaluateOpenCollection(collection, progress(81), TODAY).canContribute).toBe(
      false,
    );
  });
  it('stops exactly at goals divisible by the fixed price', () => {
    const collection = draft({ limitType: 'goal', goalAmount: '1200' });
    expect(evaluateOpenCollection(collection, progress(79), TODAY)).toMatchObject({
      canContribute: true,
      remainingSpots: 1,
    });
    expect(evaluateOpenCollection(collection, progress(80), TODAY)).toMatchObject({
      canContribute: false,
      closeReason: 'goal',
      remainingSpots: 0,
    });
  });
  it('allows only the necessary full-price contributions when the goal is not divisible', () => {
    const collection = draft({ limitType: 'goal', goalAmount: '100' });
    expect(evaluateOpenCollection(collection, progress(), TODAY)).toMatchObject({
      remainingSpots: 7,
      maximumReceivableMinorUnits: 10500,
    });
    expect(evaluateOpenCollection(collection, progress(6), TODAY, 1).canContribute).toBe(
      true,
    );
    expect(evaluateOpenCollection(collection, progress(6), TODAY, 2).canContribute).toBe(
      false,
    );
    expect(evaluateOpenCollection(collection, progress(7), TODAY)).toMatchObject({
      canContribute: false,
      closeReason: 'goal',
    });
  });
  it('uses integer minor units for small prices and non-GBP/EUR currencies', () => {
    const collection = draft({
      amount: '0.03',
      currency: 'USD',
      limitType: 'goal',
      goalAmount: '0.10',
    });
    expect(evaluateOpenCollection(collection, progress(3, 9), TODAY)).toMatchObject({
      remainingSpots: 1,
      maximumReceivableMinorUnits: 12,
      canContribute: true,
    });
    expect(evaluateOpenCollection(collection, progress(4, 12), TODAY).closeReason).toBe(
      'goal',
    );
  });
  it('uses the earliest date, capacity or manual closing condition', () => {
    const collection = draft({
      limitType: 'spots',
      spotLimit: '80',
      noDeadline: false,
      deadline: '2026-11-28',
    });
    expect(evaluateOpenCollection(collection, progress(80), TODAY).closeReason).toBe(
      'spots',
    );
    expect(
      evaluateOpenCollection(collection, progress(1), '2026-11-29').closeReason,
    ).toBe('date');
    expect(
      evaluateOpenCollection(collection, { ...progress(), manuallyClosed: true }, TODAY)
        .closeReason,
    ).toBe('manual');
  });
  it('rejects invalid configuration, counters and fractional or non-positive quantities', () => {
    for (const changes of [
      { amount: '' },
      { limitType: 'spots' as const, spotLimit: '0' },
      { limitType: 'goal' as const, goalAmount: '-1' },
      { noDeadline: false, deadline: '' },
    ])
      expect(evaluateOpenCollection(draft(changes), progress(), TODAY)).toMatchObject({
        canContribute: false,
        closeReason: 'invalid',
      });
    for (const quantity of [0, -1, 1.5, NaN, Infinity])
      expect(
        evaluateOpenCollection(draft(), progress(), TODAY, quantity).canContribute,
      ).toBe(false);
    expect(evaluateOpenCollection(draft(), progress(-1), TODAY).canContribute).toBe(
      false,
    );
    expect(evaluateOpenCollection(draft(), progress(0, NaN), TODAY).canContribute).toBe(
      false,
    );
  });
});
