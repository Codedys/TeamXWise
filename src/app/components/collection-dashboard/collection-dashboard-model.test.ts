import { describe, expect, it } from 'vitest';
import { dashboardModel } from './collection-dashboard-model';
import { defaultDashboardPreferences } from './dashboard-settings';
import type { CollectionDashboard } from './collection-dashboard-client';
const fixture = (changes: Partial<CollectionDashboard> = {}): CollectionDashboard => ({
  id: 'demo',
  isOpen: true,
  samplePaidCount: null,
  statisticsPriceMinorUnits: null,
  preferences: defaultDashboardPreferences(),
  invitationMessage: null,
  title: 'Rome',
  audience: 'group',
  currency: 'EUR',
  priceMinorUnits: 35934,
  deadline: null,
  expectedCount: 15,
  limitType: 'none',
  spotLimit: 80,
  goalMinorUnits: 120000,
  customQuestion: null,
  paidCount: 0,
  collectedMinorUnits: 0,
  status: 'active',
  ...changes,
});
describe('owner dashboard fixtures', () => {
  it('matches the group reference and updates fictional activity with local demo payments', () => {
    expect(dashboardModel(fixture())).toMatchObject({
      paid: 9,
      missing: 6,
      total: 323406,
      outstanding: 215604,
    });
    expect(dashboardModel(fixture({ paidCount: 1, collectedMinorUnits: 35934 })).paid).toBe(
      10,
    );
  });
  it('matches the 34 of 80 event reference and never adds a fake capacity for no-limit links', () => {
    const event = dashboardModel(
      fixture({ audience: 'anyone', limitType: 'spots', priceMinorUnits: 1500 }),
    );
    expect(event).toMatchObject({ paid: 34, target: 80, total: 51000 });
    expect(event.people.reduce((sum, person) => sum + person.quantity, 0)).toBe(34);
    expect(event.people[0].quantity).toBe(2);
    expect(event.days.reduce((sum, count) => sum + count, 0)).toBe(event.paid);
    expect(dashboardModel(fixture({ audience: 'anyone' })).target).toBeNull();
  });
  it('preserves collected totals after a price change and makes exported rows sum to that total', () => {
    const model = dashboardModel(
      fixture({
        audience: 'anyone',
        limitType: 'spots',
        priceMinorUnits: 2000,
        statisticsPriceMinorUnits: 1500,
        paidCount: 1,
        collectedMinorUnits: 1500,
      }),
    );
    expect(model.total).toBe(52500);
    expect(model.people.reduce((sum, person) => sum + person.amountMinorUnits, 0)).toBe(
      model.total,
    );
  });
  it('caps completed goal progress at the final full-price contribution', () => {
    expect(
      dashboardModel(
        fixture({
          audience: 'anyone',
          limitType: 'goal',
          goalMinorUnits: 10000,
          priceMinorUnits: 1500,
          paidCount: 7,
          collectedMinorUnits: 10500,
          status: 'complete',
        }),
      ),
    ).toMatchObject({ paid: 7, total: 10500, percentage: 100 });
  });
});
