'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
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
  const ease = [0.16, 1, 0.3, 1] as const;

  if (!loaded)
    return (
      <main className={`${styles.screen} ${className}`}>
        <div className={styles.empty} role="status">
          Opening Chip in preview...
        </div>
      </main>
    );

  const showReceipt =
    !!receipt &&
    !!(collection || confirmationCollection) &&
    (receipt.status === 'paid' || !!collection);

  if (!showReceipt && (!collection || error))
    return (
      <main className={`${styles.screen} ${className}`}>
        <div className={styles.empty}>
          <h1>Preview unavailable</h1>
          <p>
            {error ||
              "This demo link has expired, everyone has paid, or it is not saved in this browser. The owner's mock dashboard summary is kept separately."}
          </p>
          <Link href="/chip-in">Back to Chip in</Link>
        </div>
      </main>
    );

  const participant = collection?.participants.find((person) => person.id === selectedId);
  const closed = collection ? previewClosedReason(collection, localDateInput()) : null;

  return (
    <MotionConfig reducedMotion="user">
      <main className={`${styles.screen} ${className}`} style={{ overflow: 'clip' }}>
        <AnimatePresence mode="wait" initial={false}>
          {showReceipt ? (
            <motion.div
              key={`receipt-${receipt?.status}`}
              style={{ width: '100%' }}
              initial={{ y: '100dvh' }}
              animate={{ y: 0 }}
              exit={{ y: '100dvh' }}
              transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            >
              <PaymentResult
                collection={(collection ?? confirmationCollection)!}
                receipt={receipt!}
                canPayMore={!!collection}
                client={client}
                onAnother={another}
                onConfirmed={complete}
              />
            </motion.div>
          ) : (
            <motion.div
              key="payer"
              style={{ width: '100%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease }}
            >
              <div className={styles.payerLayout}>
                <aside className={styles.sidebar}>
                  <p>{collection!.ownerName} invites you to Chip in for</p>
                  <h2>{collection!.title}</h2>
                  <strong>
                    {displayMoney(collection!.priceMinorUnits, collection!.currency)} each
                    {collection!.deadline
                      ? `, due ${shortDeadline(collection!.deadline)}`
                      : ''}
                  </strong>
                  {collection!.description && (
                    <p className={styles.occasionDescription}>{collection!.description}</p>
                  )}
                  <span>
                    No app or account needed
                    <br />
                    <em>Frontend preview</em>
                  </span>
                </aside>
                <section className={styles.content}>
                  <span className={styles.demoBadge}>DEMO COLLECTION</span>
                  <AnimatePresence mode="wait" initial={false}>
                    {closed ? (
                      <motion.div
                        key="closed"
                        className={styles.empty}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease }}
                      >
                        <h1>{closed}</h1>
                        <p>
                          New demo contributions are no longer available for this collection.
                        </p>
                        <Link href="/chip-in">Back to Chip in</Link>
                      </motion.div>
                    ) : collection!.audience === 'group' && !participant ? (
                      <motion.div
                        key="pick"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.3, ease }}
                      >
                        <ParticipantPicker collection={collection!} onPick={setSelectedId} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`checkout-${participant?.id ?? 'open'}`}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.3, ease }}
                      >
                        <PaymentCheckout
                          key={participant?.id ?? 'open'}
                          collection={collection!}
                          participant={participant}
                          client={client}
                          onBack={another}
                          onComplete={complete}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
