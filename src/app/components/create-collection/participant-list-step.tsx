'use client';

import { useState } from 'react';
import {
  COLLECTION_STEP,
  amountInMinorUnits,
  displayMoney,
  draftNames,
  validateDraftStep,
  type CreateCollectionDraft,
} from './create-collection-draft';
import styles from './create-collection-wizard.module.css';

export function ParticipantListStep({
  draft,
  onRawChange,
  onNamesChange,
  error,
}: {
  draft: CreateCollectionDraft;
  onRawChange: (value: string) => void;
  onNamesChange: (names: string[]) => void;
  error?: string;
}) {
  const [newName, setNewName] = useState('');
  const count = draftNames(draft.names).length;
  const validation = validateDraftStep(COLLECTION_STEP.names, draft).names;
  function addName() {
    if (!newName.trim() || draft.names.length >= 500) return;
    onNamesChange([...draft.names, newName.trim()]);
    setNewName('');
  }
  if (draft.namesStage === 'paste')
    return (
      <>
        <p className={styles.description}>
          Add everyone’s name, one per line. You can check and edit the list next.
        </p>
        <label className={styles.label} htmlFor="participant-list">
          Paste your group’s names
        </label>
        <textarea
          id="participant-list"
          name="rawNames"
          className={styles.pasteArea}
          rows={10}
          maxLength={50_500}
          value={draft.rawNames}
          onChange={(event) => onRawChange(event.target.value)}
          placeholder={'Mia Kask\nOliver Tamm\nSofia Saar'}
          aria-invalid={!!error}
          aria-describedby={error ? 'error-rawNames' : undefined}
        />
        {error && (
          <p id="error-rawNames" className={styles.error} role="alert">
            {error}
          </p>
        )}
      </>
    );
  return (
    <>
      <div className={styles.rosterHeader}>
        <strong>
          {count} people ·{' '}
          {displayMoney(
            (amountInMinorUnits(draft.amount) ?? 0) * Number(draft.peopleCount),
            draft.currency,
          )}{' '}
          in total
        </strong>
        <span>Click a name to edit it</span>
      </div>
      <div className={styles.participantGrid}>
        {draft.names.map((name, index) => (
          <div className={styles.participantItem} key={index}>
            <input
              aria-label={`Person ${index + 1} name`}
              maxLength={100}
              value={name}
              onChange={(event) =>
                onNamesChange(
                  draft.names.map((previous, i) =>
                    i === index ? event.target.value : previous,
                  ),
                )
              }
              aria-invalid={!name.trim()}
            />
            <button
              type="button"
              aria-label={`Remove ${name || `person ${index + 1}`}`}
              onClick={() => onNamesChange(draft.names.filter((_, i) => i !== index))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className={styles.addParticipant}>
        <input
          aria-label="Add a name"
          placeholder="Add a name"
          value={newName}
          maxLength={100}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addName();
            }
          }}
        />
        <button
          type="button"
          onClick={addName}
          disabled={!newName.trim() || draft.names.length >= 500}
        >
          Add
        </button>
      </div>
      <p
        id="names-count"
        className={`${styles.nameCount} ${validation ? styles.countMismatch : ''}`}
        role="status"
      >
        {count} of {draft.peopleCount} people added.
        {validation ? ` ${validation}` : ' Your list is ready to review.'}
      </p>
    </>
  );
}
