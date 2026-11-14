'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { displayMoney, localDateInput } from '../create-collection/create-collection-draft';
import { shortDeadline } from '../create-collection/calendar-date';
import {
  browserCollectionPreviewClient,
  previewClosedReason,
} from '../collection-preview/browser-collection-preview-client';
import type {
  CollectionPreview,
  CollectionPreviewClient,
  PaymentReceiptPreview,
} from '../collection-preview/collection-preview-client';
import { ParticipantPicker } from './participant-picker';
import { PaymentCheckout } from './payment-checkout';
import { PaymentResult } from './payment-result';
import styles from './collection-payment.module.css';

export function CollectionPayment({
  collectionId,
  className = '',
  client = browserCollectionPreviewClient,
}: {
  collectionId: string;
  className?: string;
  client?: CollectionPreviewClient;
}) {
  const [collection, setCollection] = useState<CollectionPreview | null>(null);
  const [confirmationCollection, setConfirmationCollection] =
    useState<CollectionPreview | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceiptPreview | null>(null);
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const result = await client.get(collectionId);
        if (active) {
          setCollection(result);
          setLoaded(true);
        }
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Could not load the preview.');
          setLoaded(true);
        }
      }
    }
    void refresh();
    const receiptId = new URLSearchParams(window.location.hash.slice(1)).get('receipt');
    if (receiptId)
      void client
        .receipt(collectionId, receiptId)
        .then((result) => {
          if (active) setReceipt(result);
        })
        .catch(() => {});
    const unsubscribe = client.subscribe(() => void refresh());
    return () => {
      active = false;
      unsubscribe();
    };
  }, [client, collectionId]);
  function complete(result: PaymentReceiptPreview) {
    setConfirmationCollection(collection ?? confirmationCollection);
    setReceipt(result);
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}#receipt=${encodeURIComponent(result.id)}`,
    );
    void client.get(collectionId).then(setCollection);
  }
  function another() {
    setReceipt(null);
    setSelectedId(null);
    window.history.replaceState(null, '', window.location.pathname);
    void client.get(collectionId).then(setCollection);
  }
  if (!loaded)
    return (
      <main className={`${styles.screen} ${className}`}>
        <div className={styles.empty} role="status">
          Opening Chip in preview…
        </div>
      </main>
    );
  if (
    receipt &&
    (collection || confirmationCollection) &&
    (receipt.status === 'paid' || collection)
  )
    return (
      <main className={`${styles.screen} ${className}`}>
        <PaymentResult
          collection={(collection ?? confirmationCollection)!}
          receipt={receipt}
          canPayMore={!!collection}
          client={client}
          onAnother={another}
          onConfirmed={complete}
        />
      </main>
    );
  if (!collection || error)
    return (
      <main className={`${styles.screen} ${className}`}>
        <div className={styles.empty}>
          <h1>Preview unavailable</h1>
          <p>
            {error ||
              'This demo link has expired, everyone has paid, or it is not saved in this browser. The owner’s mock dashboard summary is kept separately.'}
          </p>
          <Link href="/chip-in">Back to Chip in</Link>
        </div>
      </main>
    );
  const participant = collection.participants.find((person) => person.id === selectedId);
  const closed = previewClosedReason(collection, localDateInput());
  return (
    <main className={`${styles.screen} ${className}`}>
      <div className={styles.payerLayout}>
        <aside className={styles.sidebar}>
          <p>{collection.ownerName} invites you to Chip in for</p>
          <h2>{collection.title}</h2>
          <strong>
            {displayMoney(collection.priceMinorUnits, collection.currency)} each
            {collection.deadline ? `, due ${shortDeadline(collection.deadline)}` : ''}
          </strong>
          {collection.description && (
            <p className={styles.occasionDescription}>{collection.description}</p>
          )}
          <span>
            No app or account needed
            <br />
            <em>Frontend preview</em>
          </span>
        </aside>
        <section className={styles.content}>
          <span className={styles.demoBadge}>DEMO COLLECTION</span>
          {closed ? (
            <div className={styles.empty}>
              <h1>{closed}</h1>
              <p>New demo contributions are no longer available for this collection.</p>
              <Link href="/chip-in">Back to Chip in</Link>
            </div>
          ) : collection.audience === 'group' && !participant ? (
            <ParticipantPicker collection={collection} onPick={setSelectedId} />
          ) : (
            <PaymentCheckout
              key={participant?.id ?? 'open'}
              collection={collection}
              participant={participant}
              client={client}
              onBack={another}
              onComplete={complete}
            />
          )}
        </section>
      </div>
    </main>
  );
}
