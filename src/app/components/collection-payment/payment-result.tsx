'use client';
import Image from 'next/image';
import { CollectionConfetti } from '../celebration/collection-confetti';
import celebration from '../celebration/collection-confetti.module.css';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { displayMoney } from '../create-collection/create-collection-draft';
import type {
  CollectionPreview,
  CollectionPreviewClient,
  PaymentReceiptPreview,
} from '../collection-preview/collection-preview-client';
import { playChaChing } from './cha-ching-sound';
import styles from './collection-payment.module.css';

export function PaymentResult({
  collection,
  receipt,
  client,
  onAnother,
  onConfirmed,
  canPayMore = true,
}: {
  canPayMore?: boolean;
  collection: CollectionPreview;
  receipt: PaymentReceiptPreview;
  client: CollectionPreviewClient;
  onAnother: () => void;
  onConfirmed: (receipt: PaymentReceiptPreview) => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = receipt.status === 'pending';
  const chimedReceiptId = useRef<string | null>(null);
  useEffect(() => {
    if (pending || chimedReceiptId.current === receipt.id) return;
    chimedReceiptId.current = receipt.id;
    playChaChing();
  }, [pending, receipt.id]);
  async function confirm() {
    setBusy(true);
    setError('');
    try {
      onConfirmed(await client.confirmBankTransfer(collection.id, receipt.id));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'The demo transfer could not be confirmed.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    const url = new URL(`/chip-in/pay/${collection.id}`, window.location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: collection.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setError('Link copied.');
      }
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError'))
        setError('Sharing is unavailable in this browser.');
    }
  }
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <MotionConfig reducedMotion="user">
      <section className={`${styles.result} ${pending ? styles.pending : ''}`}>
        {!pending && <CollectionConfetti />}
        <motion.span
          className={styles.demoBadge}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease }}
        >
          FRONTEND DEMO · NO MONEY MOVED
        </motion.span>
        {pending ? (
          <motion.div
            className={styles.resultIcon}
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.4, y: 48, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: -8 }}
            transition={{
              duration: 0.6,
              delay: 0.18,
              type: 'spring',
              stiffness: 220,
              damping: 18,
            }}
          >
            ↗
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.55,
              delay: 0.18,
              type: 'spring',
              stiffness: 200,
              damping: 22,
            }}
          >
            <Image
              src="/images/chip-in-success.png"
              sizes="310px"
              width={1426}
              height={1103}
              className={`${styles.successArtwork} ${celebration.bounce}`}
              alt=""
            />
          </motion.div>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 20, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.3,
            type: 'spring',
            stiffness: 240,
            damping: 20,
          }}
        >
          {pending ? 'TRANSFER PENDING.' : 'BOOM. CHIPPED IN.'}
        </motion.h1>
        <p>
          {pending
            ? 'A bank transfer stays pending until its payment provider confirms it.'
            : `${receipt.payerName} is in for ${collection.title}. The owner’s demo view has been updated.`}
        </p>
        <div className={styles.receipt}>
          <strong>
            {displayMoney(receipt.payMinorUnits, receipt.payCurrency)}{' '}
            {pending ? 'pending' : 'demo paid'} for {receipt.payerName}
            {receipt.quantity > 1
              ? ` + ${receipt.quantity - 1} ${receipt.quantity === 2 ? 'friend' : 'friends'}`
              : ''}
          </strong>
          <span>{collection.title}</span>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {pending ? (
          <button
            type="button"
            className={styles.resultButton}
            disabled={busy}
            onClick={() => void confirm()}
          >
            {busy ? 'Confirming demo…' : 'Simulate bank confirmation'}
          </button>
        ) : (
          <Link className={styles.resultButton} href="/chip-in">
            Done
          </Link>
        )}
        {canPayMore &&
          (collection.audience === 'group' ? (
            <button type="button" className={styles.textButton} onClick={onAnother}>
              Pay for someone else
            </button>
          ) : (
            <button type="button" className={styles.textButton} onClick={() => void share()}>
              Send the link to a friend
            </button>
          ))}
      </section>
    </MotionConfig>
  );
}
