'use client';
import type { CollectionDashboard } from './collection-dashboard-client';
import { dashboardModel } from './collection-dashboard-model';
import { DashboardDialog } from './dashboard-dialog';
import { downloadDashboardCsv } from './dashboard-export';
import styles from './dashboard-panels.module.css';

export function DashboardAnswersPanel({
  collection,
  onClose,
}: {
  collection: CollectionDashboard;
  onClose: () => void;
}) {
  const people = dashboardModel(collection).people.filter((person) => person.paid);
  const answers = people.filter((person) => person.answer);
  return (
    <DashboardDialog
      title={collection.customQuestion ?? 'Answers'}
      eyebrow="You asked"
      subtitle={`${answers.length} of ${people.length} wrote something, ${people.length - answers.length} skipped it`}
      onClose={onClose}
    >
      <div className={styles.tableScroll}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Answer</th>
            </tr>
          </thead>
          <tbody>
            {answers.map((person) => (
              <tr key={person.id}>
                <th scope="row">{person.name}</th>
                <td>{person.answer}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!answers.length && <p className={styles.empty}>No answers to show yet.</p>}
      </div>
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.primary}
          onClick={() =>
            downloadDashboardCsv(
              [
                ['Name', collection.customQuestion ?? 'Answer'],
                ...answers.map((person) => [person.name, person.answer ?? '']),
              ],
              'chip-in-demo-answers.csv',
            )
          }
        >
          Download list
        </button>
      </footer>
      <p className={styles.help}>Answers provided with locally saved demo payments.</p>
    </DashboardDialog>
  );
}
