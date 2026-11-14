'use client';
import { useState } from 'react';
import type { CollectionDashboard } from './collection-dashboard-client';
import { saveDashboardPreferencesAction } from '@/app/actions';
import { dashboardModel } from './collection-dashboard-model';
import { REMINDER_LABELS, copyableReminder } from './dashboard-settings';
import { DashboardDialog } from './dashboard-dialog';
import { displayMoney } from '../create-collection/create-collection-draft';
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
  const [status, setStatus] = useState('');
  const [manualCopy, setManualCopy] = useState('');
  const unpaid = dashboardModel(collection).people.filter((person) => !person.paid);
  const selected = unpaid.find((person) => person.id === personId);
  const message = (template: string) =>
    copyableReminder(template, {
      name: selected?.name ?? 'everyone',
      amount: displayMoney(collection.priceMinorUnits, collection.currency),
      occasion: collection.title,
      deadline: collection.deadline,
      url,
    });
  async function copy(template: string) {
    const text = message(template);
    try {
      await navigator.clipboard.writeText(text);
      setManualCopy('');
      setStatus('Reminder copied. Paste it into your chat and send it.');
    } catch {
      setManualCopy(text);
      setStatus('Select and copy the message below.');
    }
  }
  async function save() {
    const result = await saveDashboardPreferencesAction(collection.id, preferences);
    setStatus(
      result.status === 'error'
        ? result.message
        : 'Reminder templates saved. Copy a message whenever you want to send it.',
    );
  }
  return (
    <DashboardDialog
      title="Reminders"
      bottomSheet
      eyebrow={collection.title}
      onClose={onClose}
      subtitle={selected ? `For ${selected.name}` : `${unpaid.length} people still to pay`}
    >
      <p className={styles.help}>Choose a message, then copy and paste it into your chat.</p>
      <div className={styles.ruleList}>
        {preferences.rules.map((rule) => {
          return (
            <section key={rule.id} className={styles.rule}>
              <div className={styles.ruleHeader}>
                <div>
                  <h3>{REMINDER_LABELS[rule.id]}</h3>
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
                <p className={styles.message}>{message(rule.message)}</p>
              )}
              <button
                type="button"
                className={styles.primary}
                disabled={!unpaid.length || !url || !rule.message.trim()}
                onClick={() => void copy(rule.message)}
              >
                Copy message
              </button>
            </section>
          );
        })}
      </div>
      {manualCopy && (
        <label className={styles.editorLabel}>
          Copy this reminder
          <textarea
            readOnly
            rows={5}
            value={manualCopy}
            onFocus={(event) => event.target.select()}
          />
        </label>
      )}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.primary}
          onClick={() => void save()}
          disabled={preferences.rules.some((rule) => !rule.message.trim())}
        >
          Save edits
        </button>
        <button type="button" className={styles.textButton} onClick={onClose}>
          Done
        </button>
      </footer>
      <p role="status" className={styles.status}>
        {status}
      </p>
    </DashboardDialog>
  );
}
