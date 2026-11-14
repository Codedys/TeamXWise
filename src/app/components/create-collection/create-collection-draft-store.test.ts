import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyCollectionDraft } from './create-collection-draft';

const KEY = 'chip-in:create-collection-draft:v4';
const AUDIENCE = 'chip-in:create-collection-draft:v3';
const PREVIOUS = 'chip-in:create-collection-draft:v2';
const LEGACY = 'chip-in:create-collection-draft:v1';

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

function browserStorage(values = new Map<string, string>()) {
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  return values;
}

describe('browser collection draft persistence', () => {
  it('cancels all fields and progress, clears current and legacy drafts, and preserves unrelated storage', async () => {
    const populated = {
      ...emptyCollectionDraft(),
      limitType: 'goal',
      goalAmount: '100',
      collectEmail: true,
      customQuestionEnabled: true,
      customQuestion: 'Allergies?',
      title: 'Cancelled trip',
      description: 'Private details',
      peopleCount: '2',
      amount: '100',
      currency: 'GBP',
      deadline: '2026-12-20',
      noDeadline: true,
      rawNames: 'Anna, Marko',
      names: ['Anna', 'Marko'],
      namesStage: 'edit',
      step: 6,
      maxStep: 6,
    };
    const storage = browserStorage(
      new Map([
        [KEY, JSON.stringify(populated)],
        [AUDIENCE, JSON.stringify({ ...populated, version: 3 })],
        [PREVIOUS, JSON.stringify({ ...populated, version: 2 })],
        [LEGACY, JSON.stringify({ ...populated, version: 1, names: 'Anna\nMarko' })],
        ['another-feature', 'keep me'],
      ]),
    );
    const { updateCollectionDraft, resetCollectionDraft } =
      await import('./create-collection-draft-store');
    updateCollectionDraft((previous) => previous);
    expect(resetCollectionDraft()).toBe(true);
    expect(storage.has(KEY)).toBe(false);
    expect(storage.has(AUDIENCE)).toBe(false);
    expect(storage.has(PREVIOUS)).toBe(false);
    expect(storage.has(LEGACY)).toBe(false);
    expect(storage.get('another-feature')).toBe('keep me');
    updateCollectionDraft((previous) => {
      expect(previous).toEqual(emptyCollectionDraft());
      return previous;
    });
  });
  it('does not resurrect a cancelled draft when the store reloads', async () => {
    const storage = browserStorage(
      new Map([
        [
          LEGACY,
          JSON.stringify({
            ...emptyCollectionDraft(),
            version: 1,
            title: 'Old trip',
            names: 'Anna',
          }),
        ],
      ]),
    );
    const first = await import('./create-collection-draft-store');
    first.resetCollectionDraft();
    vi.resetModules();
    const reloaded = await import('./create-collection-draft-store');
    reloaded.updateCollectionDraft((previous) => {
      expect(previous).toEqual(emptyCollectionDraft());
      return previous;
    });
    expect(storage.has(LEGACY)).toBe(false);
  });
  it('still resets in-memory fields if removing saved data is blocked', async () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {
          throw new Error('blocked');
        },
      },
    });
    const { updateCollectionDraft, resetCollectionDraft } =
      await import('./create-collection-draft-store');
    updateCollectionDraft((previous) => ({
      ...previous,
      title: 'Local trip',
      names: ['Anna'],
    }));
    expect(resetCollectionDraft()).toBe(false);
    updateCollectionDraft((previous) => {
      expect(previous).toEqual(emptyCollectionDraft());
      return previous;
    });
  });
  it('restores a saved draft and persists edits without changing its selected count or names', async () => {
    const draft = {
      ...emptyCollectionDraft(),
      title: 'Rome trip',
      step: 4,
      maxStep: 4,
      noDeadline: true,
      namesStage: 'edit',
      names: Array.from({ length: 12 }, (_, i) => `Person ${i + 1}`),
    };
    const storage = browserStorage(new Map([[KEY, JSON.stringify(draft)]]));
    const { updateCollectionDraft } = await import('./create-collection-draft-store');
    updateCollectionDraft((previous) => ({ ...previous, title: 'Museum trip' }));
    expect(JSON.parse(storage.get(KEY)!)).toMatchObject({
      title: 'Museum trip',
      peopleCount: '12',
      names: draft.names,
      step: 4,
    });
  });
  it('migrates the previous browser draft on its next edit', async () => {
    const legacy = {
      ...emptyCollectionDraft(),
      version: 1,
      title: 'Rome trip',
      noDeadline: true,
      step: 5,
      maxStep: 5,
      names: Array.from({ length: 12 }, (_, i) => `Person ${i + 1}`).join('\n'),
    };
    const serialized = JSON.stringify(legacy);
    const storage = browserStorage(new Map([[LEGACY, serialized]]));
    const { updateCollectionDraft } = await import('./create-collection-draft-store');
    updateCollectionDraft((previous) => ({ ...previous, description: 'Bring lunch.' }));
    const migrated = JSON.parse(storage.get(KEY)!);
    expect(migrated.version).toBe(4);
    expect(migrated.names).toHaveLength(12);
    expect(migrated.description).toBe('Bring lunch.');
    expect(storage.get(LEGACY)).toBe(serialized);
  });
  it('keeps edits in memory when browser storage is blocked', async () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
      },
    });
    const { updateCollectionDraft } = await import('./create-collection-draft-store');
    updateCollectionDraft((previous) => ({ ...previous, title: 'A local plan' }));
    updateCollectionDraft((previous) => {
      expect(previous.title).toBe('A local plan');
      return { ...previous, description: 'Still editable' };
    });
  });
  it('loads the previous storage key and saves the migrated audience and progress to v4', async () => {
    const storage = browserStorage(
      new Map([
        [
          PREVIOUS,
          JSON.stringify({
            ...emptyCollectionDraft(),
            version: 2,
            title: 'Existing trip',
            noDeadline: true,
            step: 4,
            maxStep: 5,
            names: [],
          }),
        ],
      ]),
    );
    const { updateCollectionDraft } = await import('./create-collection-draft-store');
    updateCollectionDraft((previous) => {
      expect(previous).toMatchObject({
        version: 4,
        audience: 'group',
        audienceChosen: true,
        step: 5,
        maxStep: 6,
      });
      return previous;
    });
    expect(JSON.parse(storage.get(KEY)!)).toMatchObject({
      version: 4,
      title: 'Existing trip',
      audience: 'group',
    });
  });
});
