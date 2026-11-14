'use client';
import { useState } from 'react';
import type { CollectionDashboard } from './collection-dashboard-client';
import { browserCollectionDashboardClient } from './browser-collection-dashboard-client';
import { dashboardModel } from './collection-dashboard-model';
import { REMINDER_LABELS, reminderDate, reminderPreview } from './dashboard-settings';
import { DashboardDialog } from './dashboard-dialog';
import { displayMoney } from '../create-collection/create-collection-draft';
import { shortDeadline } from '../create-collection/calendar-date';
import styles from './dashboard-panels.module.css';

export function DashboardRemindersPanel({
  collection,
  url,
  onClose,
  personId,
}: {
  collection: CollectionDashboard;
  url: string;
  onClose: () => void;
  personId?: string;
}) {
  const [preferences, setPreferences] = useState(() =>
    structuredClone(collection.preferences),
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [showContacts, setShowContacts] = useState(false);
  const [status, setStatus] = useState('');
  const unpaid = dashboardModel(collection).people.filter((person) => !person.paid);
  const selected = unpaid.find((person) => person.id === personId);
  const target = selected ? [selected] : unpaid;
  const missing = target.filter(
    (person) =>
      !collection.preferences.contacts[person.id] &&
      unpaid.indexOf(person) >= Math.max(0, unpaid.length - 2),
  );
  const sample = selected ?? unpaid[0];
  function save() {
    if (
      Object.values(preferences.contacts).some(
        (phone) => phone && !/^\+?[0-9 ()-]{5,25}$/.test(phone),
      )
    ) {
      setStatus('Enter a valid phone number or leave it empty.');
      return;
    }
    try {
      browserCollectionDashboardClient.savePreferences(collection.id, preferences);
      onClose();
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : 'Could not save reminders.');
    }
  }
  return (
    <DashboardDialog title="Reminders" eyebrow={collection.title} onClose={onClose}>
      <div className={`${styles.settingCard} ${styles.tint}`}>
        <div>
          <h3>Automatic reminders</h3>
          <p>
            By text with the link, to {target.length} unpaid{' '}
            {target.length === 1 ? 'person' : 'people'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-label="Automatic reminders"
          aria-checked={preferences.remindersEnabled}
          className={styles.switch}
          onClick={() =>
            setPreferences((value) => ({
              ...value,
              remindersEnabled: !value.remindersEnabled,
            }))
          }
        >
          <span />
        </button>
      </div>
      <div className={styles.ruleList}>
        {preferences.rules.map((rule) => {
          const date = reminderDate(collection.deadline, rule.id);
          return (
            <section key={rule.id} className={styles.rule}>
              <div className={styles.ruleHeader}>
                <button
                  type="button"
                  className={styles.check}
                  role="checkbox"
                  aria-label={REMINDER_LABELS[rule.id]}
                  aria-checked={rule.enabled}
                  onClick={() =>
                    setPreferences((value) => ({
                      ...value,
                      rules: value.rules.map((item) =>
                        item.id === rule.id ? { ...item, enabled: !item.enabled } : item,
                      ),
                    }))
                  }
                >
                  {rule.enabled ? '✓' : ''}
                </button>
                <div>
                  <h3>{REMINDER_LABELS[rule.id]}</h3>
                  <p>
                    {date ? shortDeadline(date) : 'Choose a closing date first'}
                    {!rule.enabled ? ', switched off' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => setEditing((value) => (value === rule.id ? null : rule.id))}
                >
                  {editing === rule.id ? 'Done editing' : 'Edit text'}
                </button>
              </div>
              {editing === rule.id ? (
                <label className={styles.editorLabel}>
                  Reminder text
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={rule.message}
                    onChange={(event) =>
                      setPreferences((value) => ({
                        ...value,
                        rules: value.rules.map((item) =>
                          item.id === rule.id
                            ? { ...item, message: event.target.value }
                            : item,
                        ),
                      }))
                    }
                  />
                  <span className={styles.help}>
                    Use [name], [amount], [occasion], [date] and [link].
                  </span>
                </label>
              ) : (
                <p className={styles.message}>
                  {reminderPreview(rule.message, {
                    name: sample?.name ?? 'everyone',
                    amount: displayMoney(collection.priceMinorUnits, collection.currency),
                    occasion: collection.title,
                    deadline: collection.deadline,
                    url,
                  })}
                </p>
              )}
            </section>
          );
        })}
      </div>
      {missing.length > 0 && (
        <p className={styles.contactWarning}>
          ⚠ {missing.length} of {target.length} have no phone number.{' '}
          <button
            type="button"
            className={styles.textButton}
            onClick={() => setShowContacts((value) => !value)}
          >
            {showContacts ? 'Hide' : 'Add'}
          </button>
        </p>
      )}
      {showContacts && (
        <div className={styles.contactList}>
          {missing.map((person) => (
            <label key={person.id} className={styles.editorLabel}>
              {person.name}
              <input
                type="tel"
                value={preferences.contacts[person.id] ?? ''}
                placeholder="e.g. +372 5550 0000"
                onChange={(event) =>
                  setPreferences((value) => ({
                    ...value,
                    contacts: { ...value.contacts, [person.id]: event.target.value },
                  }))
                }
              />
            </label>
          ))}
        </div>
      )}
      <p className={styles.help}>
        Demo only. Schedules and contacts are saved locally; no texts or emails are sent.
      </p>
      <footer className={styles.footer}>
        <button type="button" className={styles.primary} onClick={save}>
          Save
        </button>
        <button
          type="button"
          className={styles.textButton}
          disabled={!target.length}
          onClick={() =>
            setStatus(
              `Reminder preview ready for ${target.length} ${target.length === 1 ? 'person' : 'people'}. Nothing was sent.`,
            )
          }
        >
          Preview reminder now
        </button>
      </footer>
      <p role="status" className={styles.status}>
        {status}
      </p>
    </DashboardDialog>
  );
}
