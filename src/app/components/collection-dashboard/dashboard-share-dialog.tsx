'use client';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { useRef, useState } from 'react';
import type { CollectionDashboard } from './collection-dashboard-client';
import { DashboardDialog } from './dashboard-dialog';
import { displayMoney } from '../create-collection/create-collection-draft';
import { shortDeadline } from '../create-collection/calendar-date';
import {
  invitationShareText,
  shareCollectionLink,
  shareCollectionQr,
} from '../collection-sharing/share-collection';
import styles from './dashboard-panels.module.css';

export function DashboardShareDialog({
  collection,
  url,
  available,
  onClose,
}: {
  collection: CollectionDashboard;
  url: string;
  available: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState('');
  const qr = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const description = `${displayMoney(collection.priceMinorUnits, collection.currency)} ${collection.audience === 'group' ? 'each' : 'per person'}${collection.deadline ? `, ${collection.audience === 'group' ? 'due' : 'open until'} ${shortDeadline(collection.deadline)}` : ''}. Pay from your bank, no app needed.`;
  const invitation =
    collection.invitationMessage ?? `${collection.title} · ${description} [link]`;
  return (
    <DashboardDialog
      title="Share the link"
      subtitle="A preview of your invitation when it lands in a chat."
      drawer={false}
      onClose={onClose}
    >
      <div className={styles.shareGrid}>
        <article className={styles.linkPreview}>
          <div>
            <Image
              src="/images/chip-in-success.png"
              alt=""
              width={1426}
              height={1103}
              sizes="340px"
            />
          </div>
          <section>
            <h3>Chip in for {collection.title}</h3>
            <p>{description}</p>
            <span>{url ? new URL(url).host : 'Chip in'}</span>
          </section>
        </article>
        <div>
          <label className={styles.label} htmlFor="dashboard-share-url">
            Link
          </label>
          <div className={styles.linkInput}>
            <input
              ref={input}
              id="dashboard-share-url"
              value={url}
              readOnly
              onFocus={(event) => event.target.select()}
            />
            <button
              type="button"
              className={styles.primary}
              disabled={!available}
              onClick={() => {
                void navigator.clipboard
                  .writeText(url)
                  .then(() => setStatus('Link copied.'))
                  .catch(() => {
                    input.current?.select();
                    setStatus('Select and copy the link.');
                  });
              }}
            >
              Copy
            </button>
          </div>
          <div className={styles.qrCard}>
            <div ref={qr} className={styles.qr}>
              <QRCode value={url} size={138} fgColor="#163300" />
            </div>
            <div>
              <h3>QR code</h3>
              <p>For a poster or a screen. People scan and chip in.</p>
              <button
                type="button"
                className={styles.textButton}
                disabled={!available}
                onClick={() => {
                  const svg = qr.current?.querySelector('svg');
                  if (svg) void shareCollectionQr(svg, collection.title, url).then(setStatus);
                }}
              >
                Share QR
              </button>
            </div>
          </div>
          <p className={styles.label}>Your invitation</p>
          <p className={styles.invitation}>{invitationShareText(invitation, url)}</p>
        </div>
      </div>
      {!available && (
        <p className={styles.warning}>
          This demo payment link is complete or expired. Its payment data has been deleted.
        </p>
      )}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.primary}
          disabled={!available}
          onClick={() =>
            void shareCollectionLink(collection.title, url, invitation).then(setStatus)
          }
        >
          Share invitation
        </button>
        {available && (
          <a
            className={styles.secondary}
            href={`mailto:?subject=${encodeURIComponent(`Chip in for ${collection.title}`)}&body=${encodeURIComponent(invitationShareText(invitation, url))}`}
          >
            Draft email
          </a>
        )}
        <Link className={styles.textButton} href={url} target="_blank" rel="noreferrer">
          Preview as a payer ↗
        </Link>
      </footer>
      <p role="status" className={styles.status}>
        {status}
      </p>
      <p className={styles.help}>
        Frontend demo · links use this browser’s saved data. Email opens a draft; nothing is
        sent automatically.
      </p>
    </DashboardDialog>
  );
}
