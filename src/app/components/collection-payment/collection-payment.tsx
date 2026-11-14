'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { displayMoney, localDateInput } from '../create-collection/create-collection-draft';
import { shortDeadline } from '../create-collection/calendar-date';
import { previewClosedReason } from '../collection-preview/browser-collection-preview-client';
import type { ChipInPreviewViewModel } from '@/adapters/presenters/chip-in-preview.view-model';
import type { PaymentReceiptViewModel } from '@/adapters/presenters/payment-receipt.view-model';
import { getChipInPreviewAction, getPaymentReceiptAction } from '@/app/actions';
import { ParticipantPicker } from './participant-picker';
import { PaymentCheckout } from './payment-checkout';
import { PaymentResult } from './payment-result';
import styles from './collection-payment.module.css';

const POLL_INTERVAL_MS = 2500;

export function CollectionPayment({
  collectionId,
  className = '',
}: {
  collectionId: string;
  className?: string;
}) {
  const [collection, setCollection] = useState<ChipInPreviewViewModel | null>(null);
  const [confirmationCollection, setConfirmationCollection] =
    useState<ChipInPreviewViewModel | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceiptViewModel | null>(null);
  useEffect(() => {
    let active = true;
    let hasLoaded = false;
    async function refresh() {
      try {
        const result = await getChipInPreviewAction(collectionId);
        if (active) {
          setCollection(result);
          setError('');
          setLoaded(true);
          hasLoaded = true;
        }
      } catch {
        // A transient poll failure keeps showing the last good state; only the first load reports an error.
        if (active && !hasLoaded) {
          setError('Could not load this link right now.');
          setLoaded(true);
        }
      }
    }
    void refresh();
    const receiptId = new URLSearchParams(window.location.hash.slice(1)).get('receipt');
    if (receiptId)
      void getPaymentReceiptAction(collectionId, receiptId).then((result) => {
        if (active) setReceipt(result);
      });
    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [collectionId]);
  function complete(result: PaymentReceiptViewModel) {
    setConfirmationCollection(collection ?? confirmationCollection);
    setReceipt(result);
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}#receipt=${encodeURIComponent(result.id)}`,
    );
    void getChipInPreviewAction(collectionId)
      .then(setCollection)
      .catch(() => {});
  }
  function another() {
    setReceipt(null);
    setSelectedId(null);
    window.history.replaceState(null, '', window.location.pathname);
    void getChipInPreviewAction(collectionId)
      .then(setCollection)
      .catch(() => {});
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
          <h1>Link unavailable</h1>
          <p>
            {error ||
              "This link has expired, everyone has paid, or the collection doesn't exist. The owner's dashboard summary is kept separately."}
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
              key="receipt"
              style={{ width: '100%' }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            >
              <PaymentResult
                collection={(collection ?? confirmationCollection)!}
                receipt={receipt!}
                canPayMore={!!collection}
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
              exit={{ x: '-6%', opacity: 0 }}
              transition={{ duration: 0.28, ease }}
            >
              <div className={styles.payerLayout}>
                <aside className={styles.sidebar}>
                  <p>{collection!.ownerName} invites you to Chip in for</p>
                  <h2>{collection!.title}</h2>
                  <strong>
                    {displayMoney(collection!.priceMinorUnits, collection!.currency)} each
                    {collection!.deadline ? `, due ${shortDeadline(collection!.deadline)}` : ''}
                  </strong>
                  {collection!.description && (
                    <p className={styles.occasionDescription}>{collection!.description}</p>
                  )}
                  <span>No app or account needed</span>
                </aside>
                <section className={styles.content}>
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
                        <p>New contributions are no longer available for this collection.</p>
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
