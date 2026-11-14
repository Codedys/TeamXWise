'use client';
import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { displayMoney, localDateInput } from '../create-collection/create-collection-draft';
import { evaluateOpenCollection } from '../create-collection/open-collection-rules';
import {
  previewClosedReason,
  previewRuleDraft,
} from './chip-in-preview-rules';
import type {
  ChipInParticipantViewModel,
  ChipInPreviewViewModel,
} from '@/adapters/presenters/chip-in-preview.view-model';
import type { PaymentReceiptViewModel } from '@/adapters/presenters/payment-receipt.view-model';
import { submitPaymentAction } from '@/app/actions';
import { demoQuote } from './demo-quote';
import styles from './collection-payment.module.css';

export function PaymentCheckout({
  collection,
  participant,
  onBack,
  onComplete,
}: {
  collection: ChipInPreviewViewModel;
  participant?: ChipInParticipantViewModel;
  onBack: () => void;
  onComplete: (receipt: PaymentReceiptViewModel) => void;
}) {
  const [detailsComplete, setDetailsComplete] = useState(!!participant);
  const [currency, setCurrency] = useState(collection.currency);
  const [quantity, setQuantity] = useState('1');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [answer, setAnswer] = useState('');
  const [method, setMethod] = useState<'instant' | 'bank'>('instant');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const requestId = useRef<string | null>(null);
  const count = collection.audience === 'group' ? 1 : Number(quantity);
  const closed = previewClosedReason(collection, localDateInput());
  const capacity =
    collection.audience === 'anyone'
      ? evaluateOpenCollection(
          previewRuleDraft(collection),
          collection.progress,
          localDateInput(),
          count,
        )
      : null;
  const quote = demoQuote(collection.priceMinorUnits, collection.currency, currency, count);
  const unavailable =
    !!closed || (participant ? participant.status !== 'unpaid' : !capacity?.canContribute);
  function changed() {
    requestId.current = null;
    setError('');
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detailsComplete) {
      if (!name.trim() || name.trim().length > 100) {
        setError('Enter your name.');
        return;
      }
      if (collection.collectEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Enter a valid email address.');
        return;
      }
      if (collection.customQuestion && !answer.trim()) {
        setError('Answer the organiser’s question.');
        return;
      }
      if (unavailable) {
        setError('Choose a quantity within the remaining capacity.');
        return;
      }
      setDetailsComplete(true);
      setError('');
      return;
    }
    if (!quote || submitting || unavailable) return;
    setSubmitting(true);
    setError('');
    requestId.current ??= crypto.randomUUID();
    try {
      const result = await submitPaymentAction({
        chipInId: collection.id,
        requestId: requestId.current,
        expectedSourceMinorUnits: quote.sourceMinorUnits,
        participantId: participant?.id ?? null,
        payerName: participant?.name ?? name,
        quantity: count,
        email,
        answer,
        currency,
        method,
      });
      if (result.status === 'error') {
        setError(result.message);
        return;
      }
      onComplete(result.receipt);
    } catch {
      setError('The payment could not be completed.');
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form onSubmit={submit} noValidate className={styles.checkout}>
      <h1 className={styles.heading}>
        {participant
          ? `Paying for ${participant.name}`
          : detailsComplete
            ? `${name}, ${count} ${count === 1 ? 'person' : 'people'}`
            : 'Your details'}
      </h1>
      <fieldset disabled={submitting}>
        {!detailsComplete && (
          <div className={styles.payerFields}>
            <label>
              Your name
              <input
                required
                name="payerName"
                maxLength={100}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  changed();
                }}
                autoComplete="name"
              />
            </label>
            {collection.collectEmail && (
              <label>
                Email for the receipt
                <input
                  required
                  name="email"
                  type="email"
                  value={email}
                  maxLength={254}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    changed();
                  }}
                  autoComplete="email"
                />
              </label>
            )}
            <label className={styles.quantityControl}>
              How many people?
              <span>
                <button
                  type="button"
                  aria-label="One fewer person"
                  disabled={count <= 1}
                  onClick={() => {
                    setQuantity(String(Math.max(1, count - 1)));
                    changed();
                  }}
                >
                  −
                </button>
                <input
                  name="quantity"
                  aria-label="How many people?"
                  type="number"
                  min={1}
                  max={capacity?.remainingSpots ?? 1_000_000}
                  step={1}
                  value={quantity}
                  onChange={(event) => {
                    setQuantity(event.target.value);
                    changed();
                  }}
                />
                <button
                  type="button"
                  aria-label="One more person"
                  disabled={count >= (capacity?.remainingSpots ?? 1_000_000)}
                  onClick={() => {
                    setQuantity(String(count + 1));
                    changed();
                  }}
                >
                  +
                </button>
              </span>
            </label>
            {capacity?.remainingSpots !== null && capacity && (
              <p className={styles.help}>
                {capacity.remainingSpots}{' '}
                {collection.limitType === 'goal'
                  ? 'full-price contributions needed to reach the goal'
                  : 'spots remaining'}
                .
              </p>
            )}
            {collection.customQuestion && (
              <label>
                {collection.customQuestion}
                <textarea
                  required
                  name="answer"
                  value={answer}
                  maxLength={1000}
                  onChange={(event) => {
                    setAnswer(event.target.value);
                    changed();
                  }}
                  rows={2}
                />
              </label>
            )}
          </div>
        )}
        {detailsComplete && (
          <>
            <div className={styles.quoteGrid}>
              <div className={styles.amountCard}>
                <strong>
                  {displayMoney(
                    collection.priceMinorUnits *
                      (Number.isSafeInteger(count) && count > 0 ? count : 1),
                    collection.currency,
                  )}
                </strong>
                <span>{count > 1 ? `${count} people · ` : ''}Collection amount</span>
              </div>
              <div className={styles.quoteCard}>
                <div>
                  <span>{collection.ownerName} gets</span>
                  <strong>
                    {displayMoney(
                      quote ? quote.sourceMinorUnits : collection.priceMinorUnits,
                      collection.currency,
                    )}
                  </strong>
                </div>
                <div>
                  <label htmlFor="payer-currency">You pay</label>
                  <select
                    id="payer-currency"
                    value={currency}
                    onChange={(event) => {
                      setCurrency(event.target.value as 'EUR' | 'GBP' | 'USD');
                      changed();
                    }}
                  >
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>USD</option>
                  </select>
                  <strong>{quote ? displayMoney(quote.payMinorUnits, currency) : '…'}</strong>
                </div>
                <p>
                  {quote
                    ? `Demo rate: 1 ${collection.currency} = ${quote.rate.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} ${currency}.`
                    : 'Preparing quote…'}{' '}
                  Rates and fees are illustrative.
                </p>
              </div>
            </div>
            <p className={styles.infoStrip}>
              This payment is for {collection.title}. No app or account is needed.
            </p>
            <div className={styles.methodChoices} aria-label="Demo payment method">
              <button
                type="button"
                aria-pressed={method === 'instant'}
                onClick={() => {
                  setMethod('instant');
                  changed();
                }}
              >
                Card or wallet demo
              </button>
              <button
                type="button"
                aria-pressed={method === 'bank'}
                onClick={() => {
                  setMethod('bank');
                  changed();
                }}
              >
                Bank transfer demo
              </button>
            </div>
            <p className={styles.demoNote}>
              Simulation only. No payment details are requested and no money moves.
            </p>
          </>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {unavailable && (
          <p className={styles.error} role="alert">
            {closed ??
              (participant?.status === 'paid'
                ? 'This person has already paid.'
                : participant?.status === 'pending'
                  ? 'A transfer is pending for this person.'
                  : 'Choose a quantity within the remaining capacity.')}
          </p>
        )}
        <div className={styles.actions}>
          {participant ? (
            <button type="button" className={styles.secondary} onClick={onBack}>
              Choose another name
            </button>
          ) : detailsComplete ? (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setDetailsComplete(false)}
            >
              Back to your details
            </button>
          ) : (
            <Link className={styles.secondary} href="/chip-in">
              Back to Chip in
            </Link>
          )}
          <button
            className={styles.primary}
            type="submit"
            disabled={(detailsComplete && !quote) || unavailable || submitting}
          >
            {!detailsComplete
              ? 'Continue'
              : submitting
                ? 'Processing demo…'
                : method === 'bank'
                  ? 'Preview bank transfer'
                  : `Demo pay ${quote ? displayMoney(quote.payMinorUnits, currency) : ''}`}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
