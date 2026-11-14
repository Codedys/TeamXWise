'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { browserCollectionPreviewClient } from '../collection-preview/browser-collection-preview-client';
import { browserCollectionDashboardClient } from './browser-collection-dashboard-client';
import { deleteCollectionPreview } from './delete-collection-preview';
import styles from './collection-dashboard.module.css';

export function DeleteCollectionButton({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  return (
    <section className={styles.deleteSection} aria-label="Delete this collection">
      <div>
        <h2>Delete collection</h2>
        <p>
          Remove this dashboard, its payment link and saved demo payments from this browser.
        </p>
      </div>
      {!confirming ? (
        <button type="button" className={styles.danger} onClick={() => setConfirming(true)}>
          Delete collection
        </button>
      ) : (
        <div className={styles.deleteConfirmation}>
          <p>This cannot be undone. Other collections will stay saved.</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setConfirming(false);
              setError('');
            }}
          >
            Keep collection
          </button>
          <button
            type="button"
            disabled={pending}
            className={styles.danger}
            onClick={() =>
              startTransition(async () => {
                setError('');
                try {
                  await deleteCollectionPreview(
                    collectionId,
                    browserCollectionPreviewClient,
                    browserCollectionDashboardClient,
                  );
                  router.replace('/');
                } catch (reason) {
                  setError(
                    reason instanceof Error
                      ? reason.message
                      : 'Could not delete this collection. Please try again.',
                  );
                }
              })
            }
          >
            {pending ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      )}
      {error && (
        <p className={styles.deleteError} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
