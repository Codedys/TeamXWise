'use client';

import type { CreateCollectionDraft, DraftErrors } from './create-collection-draft';
import styles from './create-collection-wizard.module.css';

export function CollectionQuestionsStep({
  draft,
  onChange,
  errors,
}: {
  draft: CreateCollectionDraft;
  onChange: (changes: Partial<CreateCollectionDraft>) => void;
  errors: DraftErrors;
}) {
  return (
    <>
      <p className={styles.description}>
        You don’t have a list, so each person fills this in when they pay.
      </p>
      <div className={styles.questionRows}>
        <div className={styles.questionRow}>
          <div>
            <strong>Name</strong>
            <p>Always asked, so you know who paid.</p>
          </div>
          <span className={styles.alwaysOn}>Always on</span>
        </div>
        <div className={styles.questionRow}>
          <label htmlFor="collect-email">
            <strong>Email</strong>
            <p>To send them a receipt.</p>
          </label>
          <input
            className={styles.toggle}
            id="collect-email"
            type="checkbox"
            role="switch"
            aria-label="Ask for email"
            checked={draft.collectEmail}
            onChange={(event) => onChange({ collectEmail: event.target.checked })}
          />
        </div>
        <div className={styles.questionRow}>
          <div className={styles.questionHeader}>
            <label htmlFor="custom-question-enabled">
              <strong>Your own question</strong>
              <p>One extra thing you need from everyone.</p>
            </label>
            <input
              className={styles.toggle}
              id="custom-question-enabled"
              type="checkbox"
              role="switch"
              aria-label="Ask a custom question"
              checked={draft.customQuestionEnabled}
              onChange={(event) =>
                onChange({ customQuestionEnabled: event.target.checked })
              }
            />
          </div>
          {draft.customQuestionEnabled && (
            <input
              className={styles.questionInput}
              name="customQuestion"
              aria-label="Your question"
              placeholder="e.g. Any allergies?"
              maxLength={200}
              value={draft.customQuestion}
              onChange={(event) => onChange({ customQuestion: event.target.value })}
              aria-invalid={!!errors.customQuestion}
              aria-describedby={
                errors.customQuestion ? 'error-customQuestion' : undefined
              }
            />
          )}
        </div>
      </div>
      {errors.customQuestion && (
        <p id="error-customQuestion" className={styles.error} role="alert">
          {errors.customQuestion}
        </p>
      )}
    </>
  );
}
