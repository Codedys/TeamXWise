'use client';

import { CurrencySelect } from '../currency-select/currency-select';

import {
  amountInMinorUnits,
  displayMoney,
  type CreateCollectionDraft,
} from './create-collection-draft';
import styles from './create-collection-wizard.module.css';

export function ContributionStep({
  draft,
  onAmountChange,
  onCurrencyChange,
  error,
}: {
  draft: CreateCollectionDraft;
  onAmountChange: (amount: string) => void;
  onCurrencyChange: (currency: CreateCollectionDraft['currency']) => void;
  error?: string;
}) {
  const amount = amountInMinorUnits(draft.amount) ?? 0;
  const symbol = { EUR: '€', GBP: '£', USD: '$' }[draft.currency];
  function adjust(delta: number) {
    onAmountChange(
      (Math.max(1, Math.min(100_000_000, amount + delta)) / 100)
        .toFixed(2)
        .replace(/\.00$/, ''),
    );
  }
  return (
    <>
      <label className={styles.currencyChoice}>
        Currency <CurrencySelect value={draft.currency} onChange={onCurrencyChange} />
      </label>
      <div className={styles.amountPanel}>
        <button
          type="button"
          className={styles.amountAdjust}
          aria-label="Decrease contribution by one"
          disabled={amount <= 1}
          onClick={() => adjust(-100)}
        >
          −
        </button>
        <div className={styles.amountValue}>
          <span aria-hidden="true">{symbol}</span>
          <input
            id="contribution-amount"
            name="amount"
            aria-label="Amount per person"
            aria-invalid={!!error}
            aria-describedby={error ? 'error-amount' : 'amount-total'}
            value={draft.amount}
            maxLength={20}
            inputMode="decimal"
            onChange={(event) => onAmountChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
                adjust(event.key === 'ArrowUp' ? 100 : -100);
              }
            }}
            style={{ width: `${Math.max(2, Math.min(10, draft.amount.length || 2))}ch` }}
          />
        </div>
        <button
          type="button"
          className={styles.amountAdjust}
          aria-label="Increase contribution by one"
          disabled={amount >= 100_000_000}
          onClick={() => adjust(100)}
        >
          +
        </button>
      </div>
      {error && (
        <p id="error-amount" className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.amountPresets}>
        {(draft.audience === 'anyone' ? [5, 10, 15, 25] : [5, 20, 60, 100]).map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={amount === preset * 100}
            onClick={() => onAmountChange(String(preset))}
          >
            {displayMoney(preset * 100, draft.currency)}
          </button>
        ))}
      </div>
      <p id="amount-total" className={styles.summaryStrip}>
        {draft.audience === 'anyone' ? (
          <>
            Each person pays {displayMoney(amount, draft.currency)}. They can pay for a friend
            too.
          </>
        ) : (
          <>
            {draft.peopleCount} people × {displayMoney(amount, draft.currency)} ={' '}
            {displayMoney(amount * (Number(draft.peopleCount) || 0), draft.currency)} in total
          </>
        )}
      </p>
    </>
  );
}
