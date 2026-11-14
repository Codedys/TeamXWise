'use client';
import { useState, type ReactNode } from 'react';
import type { CollectionDashboard } from './collection-dashboard-client';
import { configureChipInLinkAction, saveDashboardPreferencesAction } from '@/app/actions';
import { dashboardModel } from './collection-dashboard-model';
import { DashboardDialog } from './dashboard-dialog';
import {
  amountInMinorUnits,
  displayMoney,
  localDateInput,
} from '../create-collection/create-collection-draft';
import { shortDeadline } from '../create-collection/calendar-date';
import styles from './dashboard-panels.module.css';

export function DashboardManageLinkPanel({
  collection,
  editable,
  onClose,
  onShare,
  startAt,
}: {
  collection: CollectionDashboard;
  editable: boolean;
  onClose: () => void;
  onShare: () => void;
  startAt?: string;
}) {
  const [isOpen, setIsOpen] = useState(collection.isOpen);
  const [deadline, setDeadline] = useState(collection.deadline ?? '');
  const [limit, setLimit] = useState(collection.limitType);
  const [spots, setSpots] = useState(String(collection.spotLimit));
  const [goal, setGoal] = useState((collection.goalMinorUnits / 100).toFixed(2));
  const [price, setPrice] = useState((collection.priceMinorUnits / 100).toFixed(2));
  const [question, setQuestion] = useState(collection.customQuestion ?? '');
  const [cohosts, setCohosts] = useState(collection.preferences.cohosts);
  const [newCohost, setNewCohost] = useState('');
  const [expanded, setExpanded] = useState<string | null>(startAt ?? null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const model = dashboardModel(collection);
  async function save(closeNow = false) {
    setStatus('');
    const priceMinorUnits = amountInMinorUnits(price);
    const goalMinorUnits = amountInMinorUnits(goal);
    if (editable && (!priceMinorUnits || priceMinorUnits < collection.priceMinorUnits)) {
      setStatus('Use the current price or a higher price for new payers.');
      return;
    }
    if (
      editable &&
      limit === 'spots' &&
      (!/^\d+$/.test(spots) || Number(spots) <= model.paid || Number(spots) > 1000000)
    ) {
      setStatus(`Choose more than ${model.paid} spots, up to 1,000,000.`);
      return;
    }
    if (editable && limit === 'goal' && (!goalMinorUnits || goalMinorUnits <= model.total)) {
      setStatus('Choose a goal above the amount already collected.');
      return;
    }
    setBusy(true);
    try {
      if (editable) {
        const result = await configureChipInLinkAction(collection.id, {
          isOpen: closeNow ? false : isOpen,
          deadline: deadline || null,
          price,
          limitType: limit,
          spotLimit: spots,
          goalAmount: goal,
          customQuestion: question.trim() || null,
        });
        if (result.status === 'error') {
          setStatus(result.message);
          return;
        }
      }
      const saved = await saveDashboardPreferencesAction(collection.id, {
        ...collection.preferences,
        cohosts,
      });
      if (saved.status === 'error') {
        setStatus(saved.message);
        return;
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }
  function row(id: string, label: string, value: string, content: ReactNode) {
    return (
      <section className={styles.manageRow} key={id}>
        <button
          type="button"
          aria-expanded={expanded === id}
          onClick={() => setExpanded((value) => (value === id ? null : id))}
        >
          <strong>
            {label}
            {id === 'price' && <small>You can raise it for new payers</small>}
          </strong>
          <span>
            {value} <b>›</b>
          </span>
        </button>
        {expanded === id && <div className={styles.manageEditor}>{content}</div>}
      </section>
    );
  }
  return (
    <DashboardDialog title="Manage link" eyebrow={collection.title} onClose={onClose}>
      <div className={`${styles.settingCard} ${styles.tint}`}>
        <div>
          <h3>{editable && isOpen ? 'The link is open' : 'The link is closed'}</h3>
          <p>
            {model.paid}
            {model.target ? ` of ${model.target}` : ''}{' '}
            {collection.limitType === 'spots' ? 'spots taken' : 'people chipped in'}
          </p>
        </div>
        <button
          role="switch"
          type="button"
          aria-label="Payment link open"
          aria-checked={editable && isOpen}
          disabled={!editable || busy}
          className={styles.switch}
          onClick={() => setIsOpen((value) => !value)}
        >
          <span />
        </button>
      </div>
      {!editable && (
        <p className={styles.warning}>
          This collection is complete, so link settings can no longer be changed. Co-host
          display settings can still be updated.
        </p>
      )}
      <fieldset disabled={!editable || busy} className={styles.settingsFieldset}>
        <div className={styles.manageRows}>
          {row(
            'date',
            'Closes',
            deadline ? shortDeadline(deadline) : 'No date set',
            <label className={styles.editorLabel}>
              Closing date
              <input
                type="date"
                value={deadline}
                min={localDateInput()}
                onChange={(event) => setDeadline(event.target.value)}
              />
              <button
                type="button"
                className={styles.textButton}
                onClick={() => setDeadline('')}
              >
                No closing date
              </button>
            </label>,
          )}
          {row(
            'limit',
            limit === 'spots' ? 'Spots' : limit === 'goal' ? 'Goal' : 'Limit',
            limit === 'spots'
              ? spots
              : limit === 'goal'
                ? displayMoney(amountInMinorUnits(goal) ?? 0, collection.currency)
                : 'No limit',
            <>
              <label className={styles.editorLabel}>
                Collection limit
                <select
                  value={limit}
                  onChange={(event) =>
                    setLimit(event.target.value as CollectionDashboard['limitType'])
                  }
                >
                  <option value="none">No limit</option>
                  <option value="spots">Limited spots</option>
                  <option value="goal">Stop at a goal</option>
                </select>
              </label>
              {limit === 'spots' && (
                <label className={styles.editorLabel}>
                  Number of spots
                  <input
                    type="number"
                    min={model.paid + 1}
                    max={1000000}
                    value={spots}
                    onChange={(event) => setSpots(event.target.value)}
                  />
                </label>
              )}
              {limit === 'goal' && (
                <label className={styles.editorLabel}>
                  Collection goal ({collection.currency})
                  <input
                    inputMode="decimal"
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                  />
                </label>
              )}
            </>,
          )}
          {row(
            'price',
            'Price',
            `${displayMoney(amountInMinorUnits(price) ?? 0, collection.currency)} each`,
            <label className={styles.editorLabel}>
              Price per person ({collection.currency})
              <input
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
              <span className={styles.help}>Settled payments keep their original amount.</span>
            </label>,
          )}
          {row(
            'question',
            'Your question',
            question || 'Name only',
            <label className={styles.editorLabel}>
              Question for payers
              <input
                maxLength={200}
                value={question}
                placeholder="e.g. Any allergies?"
                onChange={(event) => setQuestion(event.target.value)}
              />
              <span className={styles.help}>Leave empty to remove the extra question.</span>
            </label>,
          )}
        </div>
      </fieldset>
      <div className={styles.manageRows}>
        {row(
          'cohosts',
          'Co-hosts',
          cohosts.length ? `${cohosts.length + 1} including you` : 'Only you',
          <>
            <ul className={styles.cohostList}>
              {cohosts.map((name) => (
                <li key={name}>
                  <span>{name}</span>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() =>
                      setCohosts((value) => value.filter((item) => item !== name))
                    }
                  >
                    Remove {name}
                  </button>
                </li>
              ))}
            </ul>
            <label className={styles.editorLabel}>
              Co-host name
              <input
                maxLength={100}
                value={newCohost}
                onChange={(event) => setNewCohost(event.target.value)}
                placeholder="e.g. Alex Kask"
              />
            </label>
            <button
              type="button"
              className={styles.secondary}
              disabled={!newCohost.trim() || cohosts.length >= 10}
              onClick={() => {
                const name = newCohost.trim();
                if (
                  cohosts.some((item) => item.toLocaleLowerCase() === name.toLocaleLowerCase())
                ) {
                  setStatus('That co-host is already listed.');
                  return;
                }
                setCohosts((value) => [...value, name]);
                setNewCohost('');
              }}
            >
              Add co-host
            </button>
            <p className={styles.help}>
              Demo display only. No invitation or account access is granted.
            </p>
          </>,
        )}
      </div>
      <div className={styles.inlineActions}>
        <button type="button" className={styles.secondary} onClick={onShare}>
          Share link & QR
        </button>
      </div>
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.primary}
          disabled={busy}
          onClick={() => void save()}
        >
          {busy ? 'Saving…' : 'Done'}
        </button>
        <button
          type="button"
          className={styles.textButton}
          disabled={!editable || busy || !collection.isOpen}
          onClick={() => void save(true)}
        >
          Close the link now
        </button>
      </footer>
      <p role="status" className={styles.status}>
        {status}
      </p>
    </DashboardDialog>
  );
}
