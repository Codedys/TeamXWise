import { describe, expect, it } from 'vitest';
import { dashboardModel } from './collection-dashboard-model';
import { defaultDashboardPreferences } from './dashboard-settings';
import type { CollectionDashboard } from './collection-dashboard-client';
import type { PaymentReceiptViewModel } from '@/adapters/presenters/payment-receipt.view-model';

const fixture = (changes: Partial<CollectionDashboard> = {}): CollectionDashboard => ({
  id: 'demo',
  title: 'Rome',
  isOpen: true,
  participants: [],
  payments: [],
  disbursements: [],
  preferences: defaultDashboardPreferences(),
  invitationMessage: null,
  audience: 'group',
  currency: 'EUR',
  priceMinorUnits: 6000,
  deadline: null,
  expectedCount: 2,
  limitType: 'none',
  spotLimit: 80,
  goalMinorUnits: 120000,
  customQuestion: null,
  paidCount: 0,
  collectedMinorUnits: 0,
  status: 'active',
  ...changes,
});
const receipt = (changes: Partial<PaymentReceiptViewModel> = {}): PaymentReceiptViewModel => ({
  id: 'payment',
  requestId: 'request',
  participantId: 'emma',
  payerName: 'Emma Ilves',
  quantity: 1,
  sourceMinorUnits: 6000,
  sourceCurrency: 'EUR',
  payMinorUnits: 6000,
  payCurrency: 'EUR',
  rate: 1,
  method: 'instant',
  status: 'paid',
  answer: null,
  createdAt: new Date(2026, 10, 14, 12).getTime(),
  paidAt: new Date(2026, 10, 14, 12).getTime(),
  ...changes,
});
describe('saved owner dashboard data', () => {
  it('shows the saved roster and pending status without inventing names or payments', () => {
    const model = dashboardModel(
      fixture({
        participants: [
          { id: 'emma', name: 'Emma Ilves', status: 'paid' },
          { id: 'karl', name: 'Karl Rebane', status: 'pending' },
        ],
        payments: [receipt()],
        paidCount: 1,
        collectedMinorUnits: 6000,
      }),
      '2026-11-14',
    );
    expect(model).toMatchObject({
      paid: 1,
      missing: 1,
      total: 6000,
      outstanding: 6000,
      available: 6000,
    });
    expect(model.people.map((person) => person.name)).toEqual(['Emma Ilves', 'Karl Rebane']);
    expect(model.people[1]).toMatchObject({
      paid: false,
      status: 'Bank transfer pending',
      amountMinorUnits: 0,
    });
    expect(model.days).toEqual([0, 0, 0, 0, 0, 1]);
  });
  it('uses open-link receipts, original amounts, quantities and answers; pending payments do not count', () => {
    const model = dashboardModel(
      fixture({
        audience: 'anyone',
        limitType: 'spots',
        priceMinorUnits: 8000,
        payments: [
          receipt({
            participantId: null,
            quantity: 2,
            sourceMinorUnits: 12000,
            answer: 'Nuts',
          }),
          receipt({
            id: 'pending',
            participantId: null,
            payerName: 'Karl',
            status: 'pending',
            paidAt: null,
            answer: null,
          }),
        ],
        paidCount: 2,
        collectedMinorUnits: 12000,
      }),
      '2026-11-14',
    );
    expect(model).toMatchObject({ paid: 2, target: 80, total: 12000 });
    expect(model.people[0]).toMatchObject({
      quantity: 2,
      answer: 'Nuts',
      amountMinorUnits: 12000,
    });
    expect(model.people.reduce((sum, person) => sum + person.amountMinorUnits, 0)).toBe(
      model.total,
    );
    expect(model.days[5]).toBe(2);
  });
  it('does not label a settled legacy receipt pending just because its date is unavailable', () => {
    const model = dashboardModel(
      fixture({
        audience: 'anyone',
        payments: [receipt({ paidAt: null })],
        paidCount: 1,
        collectedMinorUnits: 6000,
      }),
    );
    expect(model.people[0]).toMatchObject({
      paid: true,
      when: 'Paid · date unavailable',
      paidOn: '',
    });
    expect(model.days).toEqual([0, 0, 0, 0, 0, 0]);
  });
  it('does not invent a capacity for no-limit links or names for old summaries', () => {
    const model = dashboardModel(
      fixture({ audience: 'anyone', paidCount: 5, collectedMinorUnits: 30000 }),
    );
    expect(model).toMatchObject({ target: null, percentage: null, total: 30000, people: [] });
    expect(model.days).toEqual([0, 0, 0, 0, 0, 0]);
  });
  it('caps a completed goal at 100% and keeps gross collected separate from money used', () => {
    expect(
      dashboardModel(
        fixture({
          audience: 'anyone',
          limitType: 'goal',
          goalMinorUnits: 10000,
          paidCount: 7,
          collectedMinorUnits: 10500,
          status: 'complete',
          disbursements: [
            {
              requestId: 'bill',
              kind: 'bill',
              recipient: 'Bus',
              reference: '',
              amountMinorUnits: 4000,
              createdAt: 1,
            },
          ],
        }),
      ),
    ).toMatchObject({ paid: 7, total: 10500, percentage: 100, available: 6500, spent: 4000 });
  });
  it('uses real calendar dates across month boundaries and excludes older payments from the six-day chart', () => {
    const model = dashboardModel(
      fixture({
        audience: 'anyone',
        payments: [
          receipt({ paidAt: new Date(2026, 9, 31, 12).getTime() }),
          receipt({ id: 'older', paidAt: new Date(2026, 9, 20, 12).getTime() }),
        ],
      }),
      '2026-11-02',
    );
    expect(model.dayDates).toEqual([
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
    expect(model.days).toEqual([0, 0, 0, 1, 0, 0]);
  });
});
