'use client';

import {
  amountInMinorUnits,
  displayMoney,
  type CreateCollectionDraft,
  type DraftErrors,
} from './create-collection-draft';
import { evaluateOpenCollection } from './open-collection-rules';
import styles from './create-collection-wizard.module.css';

const OPTIONS = [
  {
    value: 'none',
    title: 'No limit',
    description: 'Collect from as many people as want to join.',
  },
  {
    value: 'spots',
    title: 'Limited spots',
    description: 'The link closes by itself when the last spot is paid for.',
  },
  {
    value: 'goal',
    title: 'Stop at a goal',
    description: 'For gifts: close when the total is reached.',
  },
] as const;

export function CollectionLimitStep({
  draft,
  onChange,
  errors,
}: {
  draft: CreateCollectionDraft;
  onChange: (changes: Partial<CreateCollectionDraft>) => void;
  errors: DraftErrors;
}) {
  const price = amountInMinorUnits(draft.amount) ?? 0;
  const capacity = evaluateOpenCollection(draft);
  function adjustSpots(delta: number) {
    onChange({
      spotLimit: String(
        Math.max(1, Math.min(1_000_000, (Number(draft.spotLimit) || 1) + delta)),
      ),
    });
  }
  return (
    <>
      <div className={styles.limitOptions} role="group" aria-label="Collection limit">
        {OPTIONS.map((option) => (
          <div
            key={option.value}
            className={styles.limitOption}
            data-selected={draft.limitType === option.value}
          >
            <button
              type="button"
              className={styles.limitChoice}
              aria-pressed={draft.limitType === option.value}
              onClick={() => onChange({ limitType: option.value })}
            >
              <span className={styles.limitOptionHeader}>
                <span className={styles.audienceRadio} aria-hidden="true">
                  {draft.limitType === option.value ? '✓' : ''}
                </span>
                <strong>{option.title}</strong>
              </span>
              <span>{option.description}</span>
            </button>
            {option.value === 'spots' && draft.limitType === 'spots' && (
              <div className={styles.limitAdjust}>
                <button
                  type="button"
                  aria-label="Remove one spot"
                  onClick={() => adjustSpots(-1)}
                  disabled={Number(draft.spotLimit) <= 1}
                >
                  −
                </button>
                <input
                  aria-label="Number of spots"
                  name="spotLimit"
                  type="text"
                  inputMode="numeric"
                  maxLength={7}
                  value={draft.spotLimit}
                  onChange={(event) => onChange({ spotLimit: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                      event.preventDefault();
                      adjustSpots(event.key === 'ArrowUp' ? 1 : -1);
                    }
                  }}
                  aria-invalid={!!errors.spotLimit}
                  aria-describedby={
                    errors.spotLimit ? 'error-spotLimit' : 'limit-summary'
                  }
                />
                <button
                  type="button"
                  aria-label="Add one spot"
                  onClick={() => adjustSpots(1)}
                  disabled={Number(draft.spotLimit) >= 1_000_000}
                >
                  +
                </button>
              </div>
            )}
            {option.value === 'goal' && draft.limitType === 'goal' && (
              <label className={styles.goalInput}>
                <span>Goal ({draft.currency})</span>
                <input
                  name="goalAmount"
                  aria-label={`Goal amount in ${draft.currency}`}
                  inputMode="decimal"
                  maxLength={20}
                  value={draft.goalAmount}
                  onChange={(event) => onChange({ goalAmount: event.target.value })}
                  aria-invalid={!!errors.goalAmount}
                  aria-describedby={
                    errors.goalAmount ? 'error-goalAmount' : 'limit-summary'
                  }
                />
              </label>
            )}
          </div>
        ))}
      </div>
      {(['limitType', 'spotLimit', 'goalAmount'] as const).map(
        (key) =>
          errors[key] && (
            <p key={key} id={`error-${key}`} className={styles.error} role="alert">
              {errors[key]}
            </p>
          ),
      )}
      <p id="limit-summary" className={styles.limitSummary} role="status">
        {draft.limitType === 'none'
          ? 'No cap on people or total collected. Each person pays the fixed price.'
          : draft.limitType === 'spots'
            ? capacity.closeReason === 'invalid'
              ? 'Enter a valid number of spots.'
              : `${draft.spotLimit} spots × ${displayMoney(price, draft.currency)} = up to ${displayMoney(capacity.maximumReceivableMinorUnits ?? 0, draft.currency)}`
            : capacity.closeReason === 'invalid'
              ? 'Enter a valid goal amount.'
              : `Goal ${displayMoney(amountInMinorUnits(draft.goalAmount) ?? 0, draft.currency)} · ${capacity.remainingSpots} ${capacity.remainingSpots === 1 ? 'person' : 'people'} × ${displayMoney(price, draft.currency)} = ${displayMoney(capacity.maximumReceivableMinorUnits ?? 0, draft.currency)}`}
      </p>
      <p className={styles.help}>
        {draft.limitType === 'none'
          ? 'A closing date still applies if you choose one. With no closing date, the link stays open until you close it.'
          : draft.limitType === 'spots'
            ? 'Paying for a friend uses another spot. Only successful payments count.'
            : 'Everyone pays the full price. The last contribution may take the total slightly over the goal. Once reached, no further payments are accepted.'}
      </p>
      <p className={styles.help}>
        The link closes when its limit or closing date is reached, whichever comes first.
      </p>
    </>
  );
}
