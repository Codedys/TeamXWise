'use client';

import Link from 'next/link';
import QRCode from 'react-qr-code';
import { useEffect, useRef, useState } from 'react';
import { type CreateCollectionDraft } from '../create-collection/create-collection-draft';
import { browserCollectionPreviewClient } from '../collection-preview/browser-collection-preview-client';
import type {
  CollectionPreview,
  CollectionPreviewClient,
} from '../collection-preview/collection-preview-client';
import { shareCollectionLink, shareCollectionQr } from './share-collection';
import styles from './collection-share-panel.module.css';

export function CollectionSharePanel({
  draft,
  client = browserCollectionPreviewClient,
  onPublished,
}: {
  draft: CreateCollectionDraft;
  client?: CollectionPreviewClient;
  onPublished?: (id: string) => void;
}) {
  const [collection, setCollection] = useState<CollectionPreview | null>(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    client
      .publish(draft)
      .then((result) => {
        if (!active) return;
        setCollection(result);
        onPublished?.(result.id);
        setUrl(
          new URL(`/chip-in/pay/${encodeURIComponent(result.id)}`, window.location.origin)
            .href,
        );
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error ? reason.message : 'Could not prepare this preview.',
          );
      });
    return () => {
      active = false;
    };
  }, [client, draft, onPublished]);
  useEffect(() => {
    if (!collection?.id) return;
    const id = collection.id;
    return client.subscribe(() => {
      void client.get(id).then((updated) => {
        if (updated) setCollection(updated);
        else
          setError(
            'This demo link is complete or has expired. Its payment data has been deleted. Your dashboard summary is kept.',
          );
      });
    });
  }, [client, collection?.id]);
  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`${label} copied.`);
    } catch {
      inputRef.current?.select();
      setMessage('Automatic copying is unavailable. Select and copy the link.');
    }
  }
  if (error)
    return (
      <p className={styles.error} role="alert">
        {error}
      </p>
    );
  if (!collection || !url) return <p role="status">Preparing your demo link…</p>;
  return (
    <section className={styles.share} aria-label="Share your collection preview">
      <p className={styles.summary}>
        <strong>{collection.title}</strong>
        <br />
        Share the link or QR code.
      </p>
      <div className={styles.layout}>
        <div className={styles.linkPanel}>
          <span className={styles.badge}>FRONTEND DEMO</span>
          <label htmlFor="collection-preview-link">Preview link</label>
          <div className={styles.linkRow}>
            <input
              ref={inputRef}
              id="collection-preview-link"
              value={url}
              readOnly
              onFocus={(event) => event.target.select()}
            />
            <button type="button" onClick={() => void copy(url, 'Preview link')}>
              Copy link
            </button>
          </div>
          <div className={styles.buttons}>
            <button
              type="button"
              onClick={() =>
                void shareCollectionLink(
                  collection.title,
                  url,
                  collection.invitationMessage ?? undefined,
                ).then(setMessage)
              }
            >
              Share link
            </button>
            <Link href={url} target="_blank" rel="noreferrer">
              Open payer preview ↗
            </Link>
          </div>
          <details className={styles.invitation}>
            <summary>View your invitation</summary>
            <p>{collection.invitationMessage?.replaceAll('[link]', url)}</p>
          </details>
          <details className={styles.notice}>
            <summary>About this preview</summary>
            <p>
              The payment link expires after one hour, or when everyone has paid / the limit is
              reached. Your owner dashboard stays saved until you delete it. Cross-device
              payments need the backend connection.
            </p>
          </details>
          <p className={styles.progress}>
            {collection.progress.paidSpots}{' '}
            {collection.progress.paidSpots === 1 ? 'person' : 'people'} chipped in · demo
            payments only
          </p>
        </div>
        <div className={styles.qrPanel}>
          <div ref={qrRef} className={styles.qr}>
            <QRCode
              value={url}
              size={196}
              level="M"
              bgColor="#ffffff"
              fgColor="#163300"
              title="QR code for this collection preview"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const svg = qrRef.current?.querySelector('svg');
              if (svg) void shareCollectionQr(svg, collection.title, url).then(setMessage);
            }}
          >
            Share QR code
          </button>
          <p>Scan to open the same link. Preview data stays in this browser.</p>
        </div>
      </div>
      <p className={styles.status} role="status">
        {message}
      </p>
    </section>
  );
}
