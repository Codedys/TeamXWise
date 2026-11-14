'use client';
import { useId } from 'react';
import { invitationPreview, type CreateCollectionDraft } from './create-collection-draft';
import styles from './create-collection-wizard.module.css';

export function InvitationMessageEditor({
  draft,
  onChange,
  error,
}: {
  draft: CreateCollectionDraft;
  onChange: (value: string | null) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <div>
      <h3>
        <label htmlFor={id}>The message that goes out</label>
      </h3>
      <textarea
        id={id}
        name="invitationMessage"
        className={`${styles.messageBubble} ${styles.messageEditor}`}
        rows={7}
        maxLength={2000}
        value={invitationPreview(draft)}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={!!error}
        aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
      />
      <p id={`${id}-help`} className={styles.messageHelp}>
        Edit your invitation. Your payment link is always included when sharing.
      </p>
      <button
        type="button"
        className={styles.resetMessage}
        disabled={draft.invitationMessage === null}
        onClick={() => onChange(null)}
      >
        Reset message
      </button>
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
