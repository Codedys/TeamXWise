import { dashboardModel } from '../collection-dashboard/collection-dashboard-model';
import { describe, expect, it } from 'vitest';
import { deleteCollectionPreview } from '../collection-dashboard/delete-collection-preview';
import {
  emptyCollectionDraft,
  type CreateCollectionDraft,
} from '../create-collection/create-collection-draft';
import {
  createBrowserCollectionPreviewClient,
  previewClosedReason,
  PREVIEW_LIFETIME_MS,
} from './browser-collection-preview-client';
import { createBrowserCollectionDashboardClient } from '../collection-dashboard/browser-collection-dashboard-client';
import type { CollectionPreview, PaymentPreviewRequest } from './collection-preview-client';

function fixture(storage = new Map<string, string>()) {
  let now = 1000;
  const storageAccess = () => ({
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
  });
  const dashboards = createBrowserCollectionDashboardClient({ storage: storageAccess });
  let id = 0,
    today = '2026-11-14';
  const client = createBrowserCollectionPreviewClient({
    storage: () => ({
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
    }),
    id: () => `demo-${++id}`,
    today: () => today,
    now: () => now,
    dashboards,
  });
  return {
    client,
    storage,
    dashboards,
    advance: (milliseconds: number) => {
      now += milliseconds;
    },
    setToday: (value: string) => {
      today = value;
    },
  };
}
const group = (changes: Partial<CreateCollectionDraft> = {}): CreateCollectionDraft => ({
  ...emptyCollectionDraft(),
  title: 'Class trip to Rome',
  peopleCount: '2',
  amount: '359.34',
  noDeadline: true,
  names: ['Emma Ilves', 'Karl Rebane'],
  namesStage: 'edit',
  ...changes,
});
const request = (
  collection: CollectionPreview,
  changes: Partial<PaymentPreviewRequest> = {},
): PaymentPreviewRequest => ({
  collectionId: collection.id,
  requestId: 'attempt-1',
  participantId: collection.audience === 'group' ? collection.participants[0].id : undefined,
  payerName: 'Emma Ilves',
  quantity: 1,
  email: '',
  answer: '',
  currency: 'EUR',
  method: 'instant',
  ...changes,
});

describe('browser-only collection payment preview', () => {
  it('pauses and reopens an open link without extending its expiry or changing settled payments', async () => {
    const { client, dashboards, advance } = fixture();
    const collection = await client.publish(group({ audience: 'anyone', amount: '15' }));
    dashboards.activate(collection.id);
    const receipt = await client.submit(request(collection));
    const settings = {
      isOpen: false,
      deadline: null,
      priceMinorUnits: 2000,
      limitType: 'none' as const,
      spotLimit: 80,
      goalMinorUnits: 120000,
      customQuestion: null,
    };
    await client.configure(collection.id, settings);
    await expect(client.submit(request(collection, { requestId: 'paused' }))).rejects.toThrow(
      'paused',
    );
    expect((await client.receipt(collection.id, receipt.id))?.sourceMinorUnits).toBe(1500);
    expect(dashboards.get(collection.id)?.payments[0].sourceMinorUnits).toBe(1500);
    expect(dashboards.get(collection.id)).toMatchObject({
      priceMinorUnits: 2000,
      collectedMinorUnits: 1500,
    });
    await client.configure(collection.id, { ...settings, isOpen: true });
    await expect(
      client.submit(
        request(collection, { requestId: 'stale', expectedSourceMinorUnits: 1500 }),
      ),
    ).rejects.toThrow('price changed');
    expect(
      (
        await client.submit(
          request(collection, { requestId: 'new-price', expectedSourceMinorUnits: 2000 }),
        )
      ).sourceMinorUnits,
    ).toBe(2000);
    advance(PREVIEW_LIFETIME_MS);
    expect(await client.get(collection.id)).toBeNull();
    await expect(client.configure(collection.id, settings)).rejects.toThrow('expired');
  });
  it('only reuses an edited token when the creation settings still match it', async () => {
    const { client } = fixture();
    const draft = group({ audience: 'anyone', amount: '15' });
    const original = await client.publish(draft);
    await client.configure(original.id, {
      isOpen: true,
      deadline: null,
      priceMinorUnits: 2000,
      limitType: 'none',
      spotLimit: 80,
      goalMinorUnits: 120000,
      customQuestion: null,
    });
    expect((await client.publish({ ...draft, amount: '20' })).id).toBe(original.id);
    expect((await client.publish(draft)).id).not.toBe(original.id);
  });
  it('does not invent contributions when the owner raises capacity', async () => {
    const { client, dashboards } = fixture();
    const collection = await client.publish(
      group({ audience: 'anyone', amount: '15', limitType: 'spots', spotLimit: '80' }),
    );
    dashboards.activate(collection.id);
    const before = dashboardModel(dashboards.get(collection.id)!);
    await client.configure(collection.id, {
      isOpen: true,
      deadline: null,
      priceMinorUnits: 1500,
      limitType: 'spots',
      spotLimit: 120,
      goalMinorUnits: 120000,
      customQuestion: null,
    });
    const after = dashboardModel(dashboards.get(collection.id)!);
    expect(after.paid).toBe(before.paid);
    expect(after.total).toBe(before.total);
    expect(after.target).toBe(120);
  });
  it('rejects invalid link settings and preserves progress when editing valid settings', async () => {
    const { client } = fixture();
    const collection = await client.publish(group({ audience: 'anyone', amount: '15' }));
    const settings = {
      isOpen: true,
      deadline: '2026-11-28',
      priceMinorUnits: 1500,
      limitType: 'spots' as const,
      spotLimit: 80,
      goalMinorUnits: 120000,
      customQuestion: 'Any allergies?',
    };
    await expect(
      client.configure(collection.id, { ...settings, priceMinorUnits: 1000 }),
    ).rejects.toThrow('raised');
    await expect(
      client.configure(collection.id, { ...settings, deadline: '2026-02-30' }),
    ).rejects.toThrow('closing date');
    expect(await client.configure(collection.id, settings)).toMatchObject({
      id: collection.id,
      customQuestion: 'Any allergies?',
      progress: { paidSpots: 0, receivedMinorUnits: 0 },
    });
  });

  it('deletes a dashboard and its link / receipts together without clearing another collection', async () => {
    const { client, storage, dashboards } = fixture();
    const selected = await client.publish(group());
    const other = await client.publish(group({ title: 'Another trip' }));
    dashboards.activate(selected.id);
    dashboards.activate(other.id);
    await client.submit(request(selected));
    await deleteCollectionPreview(selected.id, client, dashboards);
    expect(await client.get(selected.id)).toBeNull();
    expect(dashboards.get(selected.id)).toBeNull();
    expect(await client.get(other.id)).not.toBeNull();
    expect(dashboards.get(other.id)).not.toBeNull();
    expect(storage.get('chip-in:collection-previews:v1')).not.toContain(selected.id);
    expect(storage.get('chip-in:collection-dashboards:v1')).not.toContain(selected.id);
    expect(await fixture(storage).client.get(selected.id)).toBeNull();
    await deleteCollectionPreview(selected.id, client, dashboards);
  });
  it('also deletes the summary after its payment token has already expired', async () => {
    const { client, dashboards, advance } = fixture();
    const collection = await client.publish(group());
    dashboards.activate(collection.id);
    advance(PREVIEW_LIFETIME_MS);
    expect(await client.get(collection.id)).toBeNull();
    await deleteCollectionPreview(collection.id, client, dashboards);
    expect(dashboards.list()).toEqual([]);
  });
  it('edits the shared message without replacing the token, resetting payments, or extending expiry', async () => {
    const { client, dashboards, advance } = fixture();
    const collection = await client.publish(group());
    dashboards.activate(collection.id);
    await client.submit(request(collection));
    advance(PREVIEW_LIFETIME_MS - 1);
    const updated = await client.publish(group({ invitationMessage: 'Come along! [link]' }));
    expect(updated.id).toBe(collection.id);
    expect(updated.progress.paidSpots).toBe(1);
    expect(dashboards.get(collection.id)?.invitationMessage).toBe('Come along! [link]');
    advance(1);
    expect(await client.get(collection.id)).toBeNull();
  });

  it('deletes the token, roster and receipts when the last group payment succeeds, retaining the owner roster and payment history', async () => {
    const { client, storage, dashboards } = fixture();
    const collection = await client.publish(group());
    dashboards.activate(collection.id);
    await client.submit(request(collection));
    const receipt = await client.submit(
      request(collection, {
        requestId: 'last-person',
        participantId: collection.participants[1].id,
      }),
    );
    expect(receipt.status).toBe('paid');
    expect(await client.get(collection.id)).toBeNull();
    expect(storage.get('chip-in:collection-previews:v1')).toBe('{}');
    expect(dashboards.get(collection.id)).toMatchObject({
      status: 'complete',
      paidCount: 2,
      collectedMinorUnits: 71868,
    });
    expect(dashboards.get(collection.id)?.participants.map((person) => person.name)).toEqual([
      'Emma Ilves',
      'Karl Rebane',
    ]);
    expect(dashboards.get(collection.id)?.payments).toHaveLength(2);
    expect(
      dashboardModel(fixture(storage).dashboards.get(collection.id)!).people.every(
        (person) => person.paid,
      ),
    ).toBe(true);
    await expect(client.receipt(collection.id, receipt.id)).rejects.toThrow('complete');
    expect(await fixture(storage).client.get(collection.id)).toBeNull();
  });
  it('expires exactly one hour from creation without extending on reads or pending transfers', async () => {
    const { client, advance, storage, dashboards } = fixture();
    const collection = await client.publish(group());
    dashboards.activate(collection.id);
    const pending = await client.submit(request(collection, { method: 'bank' }));
    advance(PREVIEW_LIFETIME_MS - 1);
    expect(await client.get(collection.id)).not.toBeNull();
    advance(1);
    expect(await client.get(collection.id)).toBeNull();
    expect(storage.get('chip-in:collection-previews:v1')).toBe('{}');
    expect(dashboards.get(collection.id)?.status).toBe('expired');
    await expect(client.confirmBankTransfer(collection.id, pending.id)).rejects.toThrow(
      'expired',
    );
  });
  it('keeps no-limit links open after payments but still deletes them after one hour', async () => {
    const { client, advance } = fixture();
    const collection = await client.publish(group({ audience: 'anyone', limitType: 'none' }));
    await client.submit(request(collection, { quantity: 10 }));
    expect((await client.get(collection.id))?.progress.paidSpots).toBe(10);
    advance(PREVIEW_LIFETIME_MS);
    expect(await client.get(collection.id)).toBeNull();
  });
  it('purges legacy previews with no creation expiry instead of retaining unbounded payer data', async () => {
    const storage = new Map([
      [
        'chip-in:collection-previews:v1',
        JSON.stringify({
          old: {
            fingerprint: 'old',
            collection: { id: 'old', participants: [{ name: 'Old payer' }] },
            receipts: [],
          },
        }),
      ],
    ]);
    expect(await fixture(storage).client.get('old')).toBeNull();
    expect(storage.get('chip-in:collection-previews:v1')).toBe('{}');
  });

  it('publishes immutable snapshots, reuses unchanged settings and restores them from storage', async () => {
    const { client, storage } = fixture();
    const collection = await client.publish(group());
    expect(collection.participants.map((p) => p.name)).toEqual(['Emma Ilves', 'Karl Rebane']);
    expect((await client.publish(group({ step: 7, maxStep: 7 }))).id).toBe(collection.id);
    expect((await fixture(storage).client.get(collection.id))?.title).toBe(
      'Class trip to Rome',
    );
    const revised = await client.publish(group({ amount: '20' }));
    expect(revised.id).not.toBe(collection.id);
    expect((await client.get(collection.id))?.priceMinorUnits).toBe(35934);
  });
  it('quotes the screenshot currency conversion as explicitly simulated data', async () => {
    const { client } = fixture();
    const collection = await client.publish(group());
    expect(await client.quote(collection.id, 'GBP', 1)).toMatchObject({
      sourceMinorUnits: 35934,
      payMinorUnits: 31263,
      rate: 0.87,
    });
    await expect(client.quote(collection.id, 'EUR', 0)).rejects.toThrow('valid number');
  });
  it('marks exactly one participant paid and makes repeated request IDs idempotent', async () => {
    const { client } = fixture();
    const collection = await client.publish(group());
    const receipt = await client.submit(request(collection));
    expect(await client.submit(request(collection))).toEqual(receipt);
    expect((await client.get(collection.id))?.progress.paidSpots).toBe(1);
    expect((await client.get(collection.id))?.participants[0].status).toBe('paid');
    await expect(
      client.submit(request(collection, { requestId: 'attempt-2' })),
    ).rejects.toThrow('already paid');
    await expect(client.submit(request(collection, { quantity: 2 }))).rejects.toThrow(
      'different details',
    );
    expect((await client.publish(group())).progress.paidSpots).toBe(1);
  });
  it('keeps bank transfers pending and only updates totals after explicit demo confirmation', async () => {
    const { client } = fixture();
    const collection = await client.publish(group());
    const receipt = await client.submit(request(collection, { method: 'bank' }));
    expect(receipt.status).toBe('pending');
    expect((await client.get(collection.id))?.progress.paidSpots).toBe(0);
    expect((await client.get(collection.id))?.participants[0].status).toBe('pending');
    expect((await client.confirmBankTransfer(collection.id, receipt.id)).status).toBe('paid');
    await client.confirmBankTransfer(collection.id, receipt.id);
    expect((await client.get(collection.id))?.progress.paidSpots).toBe(1);
    expect((await client.receipt(collection.id, receipt.id))?.status).toBe('paid');
  });
  it('uses each paid-for person as a spot and validates configured payment questions', async () => {
    const { client } = fixture();
    const collection = await client.publish(
      group({
        audience: 'anyone',
        amount: '15',
        limitType: 'spots',
        spotLimit: '2',
        collectEmail: true,
        customQuestionEnabled: true,
        customQuestion: 'Any allergies?',
      }),
    );
    await expect(client.submit(request(collection, { quantity: 2 }))).rejects.toThrow('email');
    await expect(
      client.submit(request(collection, { quantity: 2, email: 'emma@example.com' })),
    ).rejects.toThrow('question');
    await client.submit(
      request(collection, { quantity: 2, email: 'emma@example.com', answer: 'None' }),
    );
    expect(await client.get(collection.id)).toBeNull();
    await expect(
      client.submit(request(collection, { requestId: 'attempt-2' })),
    ).rejects.toThrow('complete');
  });
  it('enforces a goal at the last necessary full-price contribution', async () => {
    const { client } = fixture();
    const collection = await client.publish(
      group({ audience: 'anyone', amount: '15', limitType: 'goal', goalAmount: '100' }),
    );
    await expect(client.submit(request(collection, { quantity: 8 }))).rejects.toThrow(
      'remaining capacity',
    );
    await client.submit(request(collection, { quantity: 7 }));
    expect(await client.get(collection.id)).toBeNull();
    await expect(
      client.submit(request(collection, { requestId: 'attempt-2' })),
    ).rejects.toThrow('complete');
  });
  it('closes after the deadline without changing a previously saved snapshot', async () => {
    const { client, setToday } = fixture();
    const collection = await client.publish(
      group({ noDeadline: false, deadline: '2026-11-28' }),
    );
    setToday('2026-11-29');
    expect(previewClosedReason(collection, '2026-11-29')).toContain('closed');
    await expect(client.submit(request(collection))).rejects.toThrow('closed');
    expect(await client.get(collection.id)).not.toBeNull();
  });
  it('supports the current visit when private-browser storage is blocked and handles unknown previews', async () => {
    let id = 0;
    const client = createBrowserCollectionPreviewClient({
      storage: () => {
        throw new Error('blocked');
      },
      id: () => `private-${++id}`,
      today: () => '2026-11-14',
    });
    const collection = await client.publish(group());
    expect(await client.get(collection.id)).not.toBeNull();
    expect(await client.get('missing')).toBeNull();
    expect(
      await fixture(new Map([['chip-in:collection-previews:v1', 'invalid json']])).client.get(
        'missing',
      ),
    ).toBeNull();
  });
  it('keeps real answers, names and settled timestamps in the owner view after token expiry', async () => {
    const { client, dashboards, advance, storage } = fixture();
    const collection = await client.publish(
      group({
        audience: 'anyone',
        amount: '15',
        customQuestionEnabled: true,
        customQuestion: 'Any allergies?',
      }),
    );
    dashboards.activate(collection.id);
    const pending = await client.submit(
      request(collection, { quantity: 2, method: 'bank', answer: 'Nuts' }),
    );
    expect(dashboardModel(dashboards.get(collection.id)!)).toMatchObject({
      paid: 0,
      total: 0,
    });
    advance(50);
    await client.confirmBankTransfer(collection.id, pending.id);
    advance(PREVIEW_LIFETIME_MS);
    expect(await client.get(collection.id)).toBeNull();
    const owner = fixture(storage).dashboards.get(collection.id)!;
    expect(owner.status).toBe('expired');
    expect(owner.payments[0]).toMatchObject({
      payerName: 'Emma Ilves',
      quantity: 2,
      answer: 'Nuts',
      createdAt: 1000,
      paidAt: 1050,
    });
    expect(dashboardModel(owner).people[0]).toMatchObject({
      name: 'Emma Ilves',
      quantity: 2,
      answer: 'Nuts',
      amountMinorUnits: 3000,
    });
  });
  it('hydrates an older owner summary from the surviving local payment record without adding sample people', async () => {
    const { client, dashboards, storage } = fixture();
    const collection = await client.publish(group());
    dashboards.activate(collection.id);
    await client.submit(request(collection));
    const key = 'chip-in:collection-dashboards:v1';
    const entries = JSON.parse(storage.get(key)!);
    delete entries[0].participants;
    delete entries[0].payments;
    entries[0].samplePaidCount = 9;
    entries[0].preferences.contacts = { emma: '+372 5550000' };
    storage.set(key, JSON.stringify(entries));
    await client.get(collection.id);
    const saved = fixture(storage).dashboards.get(collection.id)!;
    expect(saved.participants.map((person) => person.name)).toEqual([
      'Emma Ilves',
      'Karl Rebane',
    ]);
    expect(dashboardModel(saved)).toMatchObject({ paid: 1, total: 35934 });
    expect(saved).not.toHaveProperty('samplePaidCount');
    expect(storage.get(key)).not.toContain('contacts');
  });
});
