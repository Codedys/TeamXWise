'use client';
import Link from 'next/link';
import { CurrencySelect } from '../currency-select/currency-select';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { displayMoney, localDateInput } from '../create-collection/create-collection-draft';
import { evaluateOpenCollection } from '../create-collection/open-collection-rules';
import {
  previewClosedReason,
  previewRuleDraft,
} from '../collection-preview/browser-collection-preview-client';
import type {
  CollectionPreview,
  CollectionPreviewClient,
  ParticipantPreview,
  PaymentReceiptPreview,
  PreviewCurrency,
  QuotePreview,
} from '../collection-preview/collection-preview-client';
import styles from './collection-payment.module.css';

export function PaymentCheckout({
  collection,
  participant,
  client,
  onBack,
  onComplete,
}: {
  collection: CollectionPreview;
  participant?: ParticipantPreview;
  client: CollectionPreviewClient;
  onBack: () => void;
  onComplete: (receipt: PaymentReceiptPreview) => void;
}) {
  const [detailsComplete, setDetailsComplete] = useState(!!participant);
  const [currency, setCurrency] = useState<PreviewCurrency>(collection.currency);
  const [quantity, setQuantity] = useState('1');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [answer, setAnswer] = useState('');
  const [method, setMethod] = useState<'instant' | 'bank'>('instant');
  const [quote, setQuote] = useState<QuotePreview | null>(null);
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
  const quoteReady =
    quote &&
    quote.payCurrency === currency &&
    quote.sourceMinorUnits === collection.priceMinorUnits * count;
  const unavailable =
    !!closed || (participant ? participant.status !== 'unpaid' : !capacity?.canContribute);
  useEffect(() => {
    let active = true;
    client
      .quote(collection.id, currency, count)
      .then((result) => {
        if (active) {
          setQuote(result);
          setError('');
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setQuote(null);
          setError(
            reason instanceof Error ? reason.message : 'Could not prepare the demo quote.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [client, collection.id, collection.priceMinorUnits, currency, count]);
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
    if (!quoteReady || submitting || unavailable) return;
    setSubmitting(true);
    setError('');
    requestId.current ??= crypto.randomUUID();
    try {
      const receipt = await client.submit({
        collectionId: collection.id,
        requestId: requestId.current,
        expectedSourceMinorUnits: quote.sourceMinorUnits,
        participantId: participant?.id,
        payerName: participant?.name ?? name,
        quantity: count,
        email,
        answer,
        currency,
        method,
      });
      onComplete(receipt);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'The demo payment could not be completed.',
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      noValidate
      className={styles.checkout}
      data-stage={detailsComplete ? 'payment' : 'details'}
    >
      {detailsComplete && (
        <div className={styles.mobileCheckoutHeader}>
          <button
            type="button"
            className={styles.mobileBack}
            disabled={submitting}
            aria-label={participant ? 'Choose another name' : 'Back to your details'}
            onClick={() => (participant ? onBack() : setDetailsComplete(false))}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m14 6-6 6 6 6" />
            </svg>
          </button>
          <p>{collection.title}</p>
        </div>
      )}
      <h1 className={styles.heading}>
        {participant
          ? `Paying for ${participant.name}`
          : detailsComplete
            ? `${name}, ${count} ${count === 1 ? 'person' : 'people'}`
            : 'Your details'}
      </h1>
      <fieldset disabled={submitting}>
        <div className={styles.checkoutBody}>
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
                      setQuote(null);
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
                        quoteReady ? quote.sourceMinorUnits : collection.priceMinorUnits,
                        collection.currency,
                      )}
                    </strong>
                  </div>
                  <div>
                    <label htmlFor="payer-currency">You pay</label>
                    <CurrencySelect
                      id="payer-currency"
                      label="Payment currency"
                      value={currency}
                      disabled={submitting}
                      onChange={(value) => {
                        setCurrency(value);
                        setQuote(null);
                        changed();
                      }}
                    />
                    <strong>
                      {quoteReady ? displayMoney(quote.payMinorUnits, currency) : '…'}
                    </strong>
                  </div>
                  <p>
                    {quoteReady
                      ? `Demo rate: 1 ${collection.currency} = ${quote.rate.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} ${currency}.`
                      : 'Preparing demo quote…'}{' '}
                    Rates and fees are illustrative.
                  </p>
                </div>
              </div>
              <p className={styles.infoStrip}>
                This payment is for {collection.title}. No app or account is needed in the
                planned payer flow.
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
        </div>
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
            disabled={(detailsComplete && !quoteReady) || unavailable || submitting}
          >
            {!detailsComplete
              ? 'Continue'
              : submitting
                ? 'Processing demo…'
                : method === 'bank'
                  ? 'Preview bank transfer'
                  : `Demo pay ${quoteReady ? displayMoney(quote.payMinorUnits, currency) : ''}`}
          </button>
          {detailsComplete && (
            <button
              type="button"
              className={styles.mobileBank}
              aria-pressed={method === 'bank'}
              onClick={() => {
                setMethod(method === 'bank' ? 'instant' : 'bank');
                changed();
              }}
            >
              {method === 'bank'
                ? 'Use card or wallet instead'
                : 'Pay by bank transfer instead'}
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
