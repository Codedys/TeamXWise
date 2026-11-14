import { describe, expect, it } from 'vitest';
import { createBrowserCollectionDashboardClient } from './browser-collection-dashboard-client';
import { createBrowserCollectionPreviewClient } from '../collection-preview/browser-collection-preview-client';
import { emptyCollectionDraft } from '../create-collection/create-collection-draft';
import { dashboardModel } from './collection-dashboard-model';

async function fixture() {
  const saved = new Map<string, string>();
  let blocked = false;
  const storage = () => ({
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (blocked) throw new Error('Quota');
      saved.set(key, value);
    },
  });
  const dashboards = createBrowserCollectionDashboardClient({ storage, now: () => 1000 });
  let id = 0;
  const payments = createBrowserCollectionPreviewClient({
    storage,
    dashboards,
    now: () => 1000,
    today: () => '2026-11-14',
    id: () => `test-${++id}`,
  });
  const collection = await payments.publish({
    ...emptyCollectionDraft(),
    title: 'Party',
    audience: 'anyone',
    noDeadline: true,
    amount: '15',
  });
  dashboards.activate(collection.id);
  await payments.submit({
    collectionId: collection.id,
    requestId: 'contribution',
    payerName: 'Mari Lill',
    quantity: 2,
    email: '',
    answer: '',
    currency: 'EUR',
    method: 'instant',
  });
  const request = {
    requestId: 'bill',
    kind: 'bill' as const,
    recipient: 'Bus company',
    reference: 'Trip',
    amountMinorUnits: 1250,
  };
  return {
    saved,
    storage,
    dashboards,
    payments,
    collection,
    request,
    block: () => {
      blocked = true;
    },
  };
}
describe('local balance demo', () => {
  it('persists partial bill payments and withdrawals without changing gross contributions, then rejects overspending', async () => {
    const { dashboards, collection, request, storage } = await fixture();
    dashboards.disburse(collection.id, request);
    let model = dashboardModel(
      createBrowserCollectionDashboardClient({ storage }).get(collection.id)!,
    );
    expect(model).toMatchObject({ paid: 2, total: 3000, available: 1750, spent: 1250 });
    dashboards.disburse(collection.id, {
      ...request,
      requestId: 'withdraw',
      kind: 'withdrawal',
      recipient: 'Main account',
      amountMinorUnits: 1750,
    });
    model = dashboardModel(dashboards.get(collection.id)!);
    expect(model).toMatchObject({ total: 3000, available: 0, spent: 3000 });
    expect(() =>
      dashboards.disburse(collection.id, {
        ...request,
        requestId: 'again',
        amountMinorUnits: 1,
      }),
    ).toThrow('available balance');
  });
  it('makes confirmation idempotent but rejects reusing an ID for another amount', async () => {
    const { dashboards, collection, request } = await fixture();
    const payment = dashboards.disburse(collection.id, request);
    expect(dashboards.disburse(collection.id, request)).toEqual(payment);
    expect(dashboards.get(collection.id)?.disbursements).toHaveLength(1);
    expect(() =>
      dashboards.disburse(collection.id, { ...request, amountMinorUnits: 100 }),
    ).toThrow('reference');
    expect(dashboardModel(dashboards.get(collection.id)!).available).toBe(1750);
  });
  it.each([0, -1, 1.5, 3001, Infinity])(
    'rejects invalid or unaffordable amount %s',
    async (amountMinorUnits) => {
      const { dashboards, collection, request } = await fixture();
      expect(() =>
        dashboards.disburse(collection.id, { ...request, amountMinorUnits }),
      ).toThrow();
      expect(dashboardModel(dashboards.get(collection.id)!).available).toBe(3000);
    },
  );
  it('does not show a successful payment or reduce the balance when storage is full', async () => {
    const { dashboards, collection, request, block } = await fixture();
    block();
    expect(() => dashboards.disburse(collection.id, request)).toThrow('storage');
    expect(dashboards.get(collection.id)?.disbursements).toEqual([]);
  });
  it('keeps later contributions and pending bank transfers separate from money used', async () => {
    const { dashboards, payments, collection, request, storage } = await fixture();
    dashboards.disburse(collection.id, request);
    const bank = await payments.submit({
      collectionId: collection.id,
      requestId: 'bank',
      payerName: 'Karl',
      quantity: 1,
      email: '',
      answer: '',
      currency: 'EUR',
      method: 'bank',
    });
    expect(dashboardModel(dashboards.get(collection.id)!).available).toBe(1750);
    await payments.confirmBankTransfer(collection.id, bank.id);
    expect(dashboardModel(dashboards.get(collection.id)!)).toMatchObject({
      total: 4500,
      available: 3250,
      spent: 1250,
    });
    dashboards.remove(collection.id);
    expect(createBrowserCollectionDashboardClient({ storage }).get(collection.id)).toBeNull();
  });
});
