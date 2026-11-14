'use client';
import { useState } from 'react';
import type { CollectionDashboard } from './collection-dashboard-client';
import { dashboardModel } from './collection-dashboard-model';
import { DashboardDialog } from './dashboard-dialog';
import { downloadDashboardCsv } from './dashboard-export';
import { displayMoney } from '../create-collection/create-collection-draft';
import { shortDeadline } from '../create-collection/calendar-date';
import styles from './dashboard-panels.module.css';

export function DashboardPeoplePanel({
  collection,
  onClose,
  initial = 'all',
}: {
  collection: CollectionDashboard;
  onClose: () => void;
  initial?: 'all' | 'paid' | 'unpaid';
}) {
  const model = dashboardModel(collection);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initial);
  const rows = model.people.filter(
    (person) =>
      person.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
      (filter === 'all' || person.paid === (filter === 'paid')),
  );
  const exportRows = () =>
    downloadDashboardCsv(
      [
        ['Name', 'People', 'Paid on', 'Status', `Amount (${collection.currency})`],
        ...rows.map((person) => [
          person.name,
          person.quantity,
          person.paidOn,
          person.status,
          ((person.paid ? person.amountMinorUnits : collection.priceMinorUnits) / 100).toFixed(
            2,
          ),
        ]),
      ],
      'chip-in-demo-people.csv',
    );
  return (
    <DashboardDialog
      title="Who’s chipped in"
      eyebrow={`${model.people.filter((person) => person.paid).length} payments, ${model.paid} people, ${displayMoney(model.total, collection.currency)}`}
      onClose={onClose}
    >
      <label className={styles.search}>
        <span>Search names</span>
        <input
          type="search"
          placeholder="Search names"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      {model.group && (
        <div className={styles.filters}>
          {(['all', 'paid', 'unpaid'] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value === 'all' ? 'Everyone' : value === 'paid' ? 'Paid' : 'Unpaid'}
            </button>
          ))}
        </div>
      )}
      <div className={styles.tableScroll}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>People</th>
              <th>Paid on</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((person) => (
              <tr key={person.id}>
                <th scope="row">{person.name}</th>
                <td>{person.quantity}</td>
                <td>{person.paidOn ? shortDeadline(person.paidOn) : person.status}</td>
                <td>
                  {displayMoney(
                    person.paid ? person.amountMinorUnits : collection.priceMinorUnits,
                    collection.currency,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className={styles.empty}>No names match your search.</p>}
      </div>
      <p className={styles.help}>
        Showing {rows.length} of {model.people.length} · scroll for more. Saved locally in this
        browser.
      </p>
      <footer className={styles.footer}>
        <button type="button" className={styles.primary} onClick={exportRows}>
          Download list
        </button>
      </footer>
    </DashboardDialog>
  );
}
