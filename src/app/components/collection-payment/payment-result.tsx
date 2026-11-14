'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { displayMoney } from '../create-collection/create-collection-draft';
import type {
  CollectionPreview,
  CollectionPreviewClient,
  PaymentReceiptPreview,
} from '../collection-preview/collection-preview-client';
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
  return (
    <section className={`${styles.result} ${pending ? styles.pending : ''}`}>
      <span className={styles.demoBadge}>FRONTEND DEMO · NO MONEY MOVED</span>
      {pending ? (
        <div className={styles.resultIcon} aria-hidden="true">
          ↗
        </div>
      ) : (
        <Image
          src="/images/chip-in-success.png"
          sizes="310px"
          width={1426}
          height={1103}
          className={styles.successArtwork}
          alt=""
        />
      )}
      <h1>{pending ? 'TRANSFER PENDING.' : 'BOOM. CHIPPED IN.'}</h1>
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
  );
}
