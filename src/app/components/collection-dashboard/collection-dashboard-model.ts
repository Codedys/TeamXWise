import type { CollectionDashboard } from './collection-dashboard-client';

const SAMPLE_NAMES = [
  'Mari Lill',
  'Tõnu Kask',
  'Liis Mägi',
  'Rauno Saar',
  'Kerli Põld',
  'Siim Laas',
  'Anett Kuus',
  'Marko Teder',
  'Hugo Mets',
  'Rasmus Lepik',
  'Laura Kuusk',
  'Anna Sepp',
  'Marten Oja',
  'Sander Rand',
  'Oliver Tamm',
  'Emma Ilves',
  'Karl Rebane',
  'Liisa Pärn',
  'Joonas Luik',
  'Mia Kask',
  'Sofia Saar',
];
export function dashboardModel(collection: CollectionDashboard) {
  const group = collection.audience === 'group';
  const initialGoalCount = Math.ceil(collection.goalMinorUnits / collection.priceMinorUnits);
  const samplePaid =
    collection.samplePaidCount ??
    (group
      ? Math.floor(collection.expectedCount * 0.6)
      : Math.min(
          34,
          collection.limitType === 'spots'
            ? Math.floor(collection.spotLimit * 0.425)
            : collection.limitType === 'goal'
              ? Math.floor(initialGoalCount * 0.425)
              : 34,
        ));
  let target = group
    ? collection.expectedCount
    : collection.limitType === 'spots'
      ? collection.spotLimit
      : null;
  const paid =
    collection.status === 'complete'
      ? collection.paidCount
      : Math.min(target ?? Number.MAX_SAFE_INTEGER, samplePaid + collection.paidCount);
  const virtualPaid = Math.max(0, paid - collection.paidCount);
  const total =
    virtualPaid * (collection.statisticsPriceMinorUnits ?? collection.priceMinorUnits) +
    collection.collectedMinorUnits;
  if (!group && collection.limitType === 'goal')
    target =
      paid +
      Math.ceil(Math.max(0, collection.goalMinorUnits - total) / collection.priceMinorUnits);
  const missing = target === null ? 0 : Math.max(0, target - paid);
  const outstanding = missing * collection.priceMinorUnits;
  // These names and activity values are fixtures, never saved payer information.
  const people = Array.from(
    { length: group ? collection.expectedCount : Math.min(paid, 21) },
    (_, index) => ({
      id: `sample-${index}`,
      paidOn: `2026-11-${String(14 - Math.min(5, Math.floor(index / 4))).padStart(2, '0')}`,
      answer:
        index < 9
          ? [
              'Nuts',
              'One of us is vegetarian',
              'Gluten',
              'No pork please',
              'Lactose',
              'Vegan',
              'Shellfish',
              'Coeliac, strictly no gluten',
              'Peanuts',
            ][index]
          : null,
      name:
        SAMPLE_NAMES[index % SAMPLE_NAMES.length] +
        (index >= SAMPLE_NAMES.length
          ? ` ${Math.floor(index / SAMPLE_NAMES.length) + 1}`
          : ''),
      quantity: group
        ? 1
        : Math.floor(paid / Math.min(paid, 21)) + (index < paid % Math.min(paid, 21) ? 1 : 0),
      paid: !group || index >= missing,
      status:
        index % 3 === 0
          ? 'Opened the link, hasn’t paid'
          : index % 3 === 1
            ? 'Reminded 2 days ago'
            : 'Hasn’t opened the link',
      when: index === 0 ? 'just now' : `${index * 4} min ago`,
    }),
  );
  let allocated = 0;
  const paymentPeople = people.filter((person) => person.paid);
  const peopleWithAmounts = people.map((person) => {
    const last = person.id === paymentPeople.at(-1)?.id;
    const amountMinorUnits = !person.paid
      ? 0
      : last
        ? total - allocated
        : Math.floor((total * person.quantity) / Math.max(1, paid));
    allocated += amountMinorUnits;
    return { ...person, amountMinorUnits };
  });
  const days = [6, 1, 9, 2, 4].map((weight) => Math.floor((samplePaid * weight) / 34));
  days.push(paid - days.reduce((sum, value) => sum + value, 0));
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
    people: peopleWithAmounts,
    days,
    percentage,
  };
}
export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}
