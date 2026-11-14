'use client';
import { useRef, useState } from 'react';
import type { CollectionDashboard, DisbursementRequest } from './collection-dashboard-client';
import { browserCollectionDashboardClient } from './browser-collection-dashboard-client';
import { dashboardModel } from './collection-dashboard-model';
import { DashboardDialog } from './dashboard-dialog';
import { displayMoney } from '../create-collection/create-collection-draft';
import styles from './dashboard-panels.module.css';

export function DashboardBalancePanel({
  collection,
  onClose,
}: {
  collection: CollectionDashboard;
  onClose: () => void;
}) {
  const { available } = dashboardModel(collection);
  const [kind, setKind] = useState<'bill' | 'withdrawal'>('bill');
  const [amount, setAmount] = useState((available / 100).toFixed(2));
  const [recipient, setRecipient] = useState('');
  const [reference, setReference] = useState('');
  const [stage, setStage] = useState<'amount' | 'review' | 'done'>('amount');
  const [error, setError] = useState('');
  const requestId = useRef<string | null>(null);
  const submitted = useRef(false);
  const money = (value: number) => displayMoney(value, collection.currency);
  const minor = Math.round(Number(amount) * 100);
  const valid =
    /^\d+(\.\d{1,2})?$/.test(amount) &&
    Number.isSafeInteger(minor) &&
    minor > 0 &&
    minor <= available;
  const destination = kind === 'withdrawal' ? 'Main account' : recipient.trim();
  const [paidAmount, setPaidAmount] = useState(0);
  function review(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || !destination) return;
    setError('');
    setStage('review');
  }
  function confirm() {
    if (submitted.current) return;
    submitted.current = true;
    try {
      requestId.current ??= crypto.randomUUID();
      const request: DisbursementRequest = {
        requestId: requestId.current,
        kind,
        amountMinorUnits: minor,
        recipient: destination,
        reference: reference.trim(),
      };
      const payment = browserCollectionDashboardClient.disburse(collection.id, request);
      setPaidAmount(payment.amountMinorUnits);
      setStage('done');
    } catch (reason) {
      submitted.current = false;
      setError(reason instanceof Error ? reason.message : 'Could not save the demo payment.');
    }
  }
  return (
    <DashboardDialog
      title={
        stage === 'done'
          ? 'Demo complete'
          : stage === 'review'
            ? 'Check the amount'
            : 'Use your balance'
      }
      eyebrow={collection.title}
      subtitle="Frontend demo · no money moves"
      onClose={onClose}
    >
      <div className={`${styles.settingCard} ${styles.tint}`}>
        <div>
          <h3>Available balance</h3>
          <p>{money(available)}</p>
        </div>
      </div>
      {stage === 'amount' && (
        <form onSubmit={review}>
          <div className={styles.filters}>
            <button
              type="button"
              aria-pressed={kind === 'bill'}
              onClick={() => setKind('bill')}
            >
              Pay a bill
            </button>
            <button
              type="button"
              aria-pressed={kind === 'withdrawal'}
              onClick={() => setKind('withdrawal')}
            >
              Move to main account
            </button>
          </div>
          <label className={styles.editorLabel}>
            Amount ({collection.currency})
            <input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-describedby="balance-amount-help"
            />
          </label>
          <p id="balance-amount-help" className={styles.help}>
            {available === 0
              ? 'There is no balance left to use.'
              : `Enter an amount up to ${money(available)}.`}
          </p>
          {kind === 'bill' && (
            <label className={styles.editorLabel}>
              Who are you paying?
              <input
                value={recipient}
                maxLength={120}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="e.g. Trip organiser"
                required
              />
            </label>
          )}
          <label className={styles.editorLabel}>
            Reference (optional)
            <input
              value={reference}
              maxLength={200}
              onChange={(event) => setReference(event.target.value)}
              placeholder="e.g. Bus booking"
            />
          </label>
          <p className={styles.help}>
            {kind === 'withdrawal'
              ? 'Move the amount back to your main account in this demo.'
              : 'Review the bill amount before confirming the demo payment.'}
          </p>
          <footer className={styles.footer}>
            <button type="submit" className={styles.primary} disabled={!valid || !destination}>
              Review amount
            </button>
          </footer>
        </form>
      )}
      {stage === 'review' && (
        <>
          <div className={styles.message}>
            <p>{kind === 'bill' ? 'Pay a bill' : 'Move to main account'}</p>
            <h3>{money(minor)}</h3>
            <p>To {destination}</p>
            {reference && <p>{reference}</p>}
            <p>Balance after: {money(Math.max(0, available - minor))}</p>
          </div>
          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.primary}
              disabled={!valid}
              onClick={confirm}
            >
              Confirm demo {kind === 'bill' ? 'payment' : 'transfer'}
            </button>
            <button
              type="button"
              className={styles.textButton}
              onClick={() => {
                requestId.current = null;
                setStage('amount');
              }}
            >
              Back
            </button>
          </footer>
          {!valid && (
            <p className={styles.help}>Your balance changed. Go back and update the amount.</p>
          )}
        </>
      )}
      {stage === 'done' && (
        <>
          <p className={styles.message}>
            {money(paidAmount)}{' '}
            {kind === 'bill'
              ? `recorded as a bill payment to ${destination}`
              : 'moved to your demo main account'}
            . No real money moved.
          </p>
          <footer className={styles.footer}>
            <button type="button" className={styles.primary} onClick={onClose}>
              Done
            </button>
          </footer>
        </>
      )}
      {error && (
        <p role="alert" className={styles.status}>
          {error}
        </p>
      )}
    </DashboardDialog>
  );
}
