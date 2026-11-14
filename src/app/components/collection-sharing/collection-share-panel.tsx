'use client';

import Link from 'next/link';
import QRCode from 'react-qr-code';
import { useEffect, useRef, useState } from 'react';
import {
  draftNames,
  invitationPreview,
  type CreateCollectionDraft,
} from '../create-collection/create-collection-draft';
import { publishChipInAction, getChipInPreviewAction } from '@/app/actions';
import type { ChipInPreviewViewModel } from '@/adapters/presenters/chip-in-preview.view-model';
import { shareCollectionLink, shareCollectionQr } from './share-collection';
import styles from './collection-share-panel.module.css';

const POLL_INTERVAL_MS = 2500;

export function CollectionSharePanel({
  draft,
  onPublished,
}: {
  draft: CreateCollectionDraft;
  onPublished?: (id: string) => void;
}) {
  const [collection, setCollection] = useState<ChipInPreviewViewModel | null>(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // A ref (not state) so the publish call survives React Strict Mode's dev-only
  // mount→cleanup→remount: the promise is created once, but every effect run below
  // attaches its own listener, so whichever run is still mounted when it resolves
  // is the one that updates state.
  const publishResult = useRef<ReturnType<typeof publishChipInAction> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    publishResult.current ??= publishChipInAction({
      title: draft.title,
      description: draft.description,
      audience: draft.audience,
      amount: draft.amount,
      currency: draft.currency,
      deadline: draft.noDeadline ? null : draft.deadline,
      limitType: draft.limitType,
      spotLimit: draft.spotLimit,
      goalAmount: draft.goalAmount,
      collectEmail: draft.audience === 'anyone' && draft.collectEmail,
      customQuestion:
        draft.audience === 'anyone' && draft.customQuestionEnabled
          ? draft.customQuestion.trim()
          : null,
      invitationMessage: invitationPreview(draft),
      names: draft.audience === 'group' ? draftNames(draft.names) : [],
    });
    publishResult.current
      .then((result) => {
        if (!active) return;
        if (result.status === 'error') {
          setError(result.message);
          return;
        }
        setCollection(result.chipIn);
        onPublished?.(result.chipIn.id);
        setUrl(
          new URL(`/chip-in/pay/${encodeURIComponent(result.chipIn.id)}`, window.location.origin)
            .href,
        );
      })
      .catch(() => {
        if (active) setError('Could not publish this collection right now.');
      });
    return () => {
      active = false;
    };
  }, [draft, onPublished]);
  useEffect(() => {
    if (!collection?.id) return;
    const id = collection.id;
    const timer = setInterval(() => {
      void getChipInPreviewAction(id)
        .then((updated) => {
          if (updated) setCollection(updated);
        })
        .catch(() => {
          // A transient poll failure keeps showing the last good state.
        });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [collection?.id]);
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
  if (!collection || !url) return <p role="status">Preparing your link…</p>;
  return (
    <section className={styles.share} aria-label="Share your collection">
      <p className={styles.summary}>
        <strong>{collection.title}</strong>
        <br />
        Your link and QR open the same payer page.
      </p>
      <div className={styles.layout}>
        <div className={styles.linkPanel}>
          <label htmlFor="collection-preview-link">Payment link</label>
          <div className={styles.linkRow}>
            <input
              ref={inputRef}
              id="collection-preview-link"
              value={url}
              readOnly
              onFocus={(event) => event.target.select()}
            />
            <button type="button" onClick={() => void copy(url, 'Payment link')}>
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
              Open payer page ↗
            </Link>
          </div>
          <details className={styles.invitation}>
            <summary>View your invitation</summary>
            <p>{collection.invitationMessage?.replaceAll('[link]', url)}</p>
          </details>
          <p className={styles.progress}>
            {collection.progress.paidSpots}{' '}
            {collection.progress.paidSpots === 1 ? 'person' : 'people'} chipped in
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
              title="QR code for this collection"
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
          <p>Scan to open the same link from any device.</p>
        </div>
      </div>
      <p className={styles.status} role="status">
        {message}
      </p>
    </section>
  );
}
