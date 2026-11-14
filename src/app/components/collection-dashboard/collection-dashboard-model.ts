import type { CollectionDashboard } from './collection-dashboard-client';
import { localDateInput } from '../create-collection/create-collection-draft';
import { shortDeadline, dateFromInput } from '../create-collection/calendar-date';

/** Derive both dashboard layouts from the saved roster and confirmed demo receipts. */
export function dashboardModel(collection: CollectionDashboard, today?: string) {
  const group = collection.audience === 'group';
  const paid = collection.paidCount;
  const total = collection.collectedMinorUnits;
  const target = group
    ? collection.expectedCount
    : collection.limitType === 'spots'
      ? collection.spotLimit
      : collection.limitType === 'goal'
        ? paid +
          Math.ceil(
            Math.max(0, collection.goalMinorUnits - total) / collection.priceMinorUnits,
          )
        : null;
  const missing = target === null ? 0 : Math.max(0, target - paid);
  const outstanding =
    group || collection.limitType !== 'goal'
      ? missing * collection.priceMinorUnits
      : Math.max(0, collection.goalMinorUnits - total);
  const people = group
    ? collection.participants.map((person) => {
        const receipt = collection.payments.find(
          (payment) => payment.participantId === person.id && payment.status === 'paid',
        );
        const paidOn = receipt?.paidAt == null ? '' : localDateInput(new Date(receipt.paidAt));
        return {
          id: person.id,
          name: person.name,
          quantity: 1,
          paid: person.status === 'paid',
          paidOn,
          answer: receipt?.answer ?? null,
          status:
            person.status === 'paid'
              ? 'Paid · thank you!'
              : person.status === 'pending'
                ? 'Bank transfer pending'
                : 'Hasn’t paid yet',
          when: paidOn ? shortDeadline(paidOn) : '',
          amountMinorUnits: receipt?.sourceMinorUnits ?? 0,
        };
      })
    : [...collection.payments]
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        .map((receipt) => {
          const paidOn =
            receipt.paidAt == null ? '' : localDateInput(new Date(receipt.paidAt));
          return {
            id: receipt.id,
            name: receipt.payerName,
            quantity: receipt.quantity,
            paid: receipt.status === 'paid',
            paidOn,
            answer: receipt.answer,
            status: receipt.status === 'paid' ? 'Paid · thank you!' : 'Bank transfer pending',
            when:
              receipt.status === 'pending'
                ? 'Bank transfer pending'
                : paidOn
                  ? shortDeadline(paidOn)
                  : 'Paid · date unavailable',
            amountMinorUnits: receipt.status === 'paid' ? receipt.sourceMinorUnits : 0,
          };
        });
  // A deterministic fallback keeps this model safe during server rendering.
  const endDate = dateFromInput(
    today ??
      people
        .map((person) => person.paidOn)
        .filter(Boolean)
        .sort()
        .at(-1) ??
      '1970-01-01',
  )!;
  const dayDates = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(endDate);
    date.setDate(date.getDate() - (5 - index));
    return localDateInput(date);
  });
  const days = dayDates.map((date) =>
    collection.payments
      .filter(
        (payment) =>
          payment.status === 'paid' &&
          payment.paidAt !== null &&
          localDateInput(new Date(payment.paidAt)) === date,
      )
      .reduce((sum, payment) => sum + payment.quantity, 0),
  );
  const spent = collection.disbursements.reduce(
    (sum, payment) => sum + payment.amountMinorUnits,
    0,
  );
  const percentage =
    collection.limitType === 'goal' && !group
      ? Math.min(100, (total / collection.goalMinorUnits) * 100)
      : target
        ? Math.min(100, (paid / target) * 100)
        : null;
  return {
    group,
    target,
    paid,
    total,
    missing,
    outstanding,
    people,
    days,
    dayDates,
    percentage,
    available: Math.max(0, total - spent),
    spent,
  };
}
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('');
}
