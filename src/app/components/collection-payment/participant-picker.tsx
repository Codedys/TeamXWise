'use client';
import { useState } from 'react';
import type { CollectionPreview } from '../collection-preview/collection-preview-client';
import styles from './collection-payment.module.css';

export function ParticipantPicker({
  collection,
  onPick,
}: {
  collection: CollectionPreview;
  onPick: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const people = collection.participants.filter((person) =>
    person.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <>
      <h1 className={styles.heading}>Who are you paying for?</h1>
      {collection.participants.length > 10 && (
        <input
          className={styles.search}
          aria-label="Find a name"
          placeholder="Find a name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      )}
      <div className={styles.nameGrid}>
        {people.map((person) => (
          <button
            key={person.id}
            type="button"
            className={styles.person}
            disabled={person.status !== 'unpaid'}
            onClick={() => onPick(person.id)}
          >
            <span>{person.name}</span>
            <span>
              {person.status === 'paid'
                ? 'Already paid ✓'
                : person.status === 'pending'
                  ? 'Transfer pending'
                  : '›'}
            </span>
          </button>
        ))}
      </div>
      {!people.length && <p className={styles.help}>No matching names.</p>}
      <p className={styles.help}>
        Can’t find the name? Ask {collection.ownerName} to add it.
      </p>
      <p className={styles.demoNote}>
        Frontend demo · selecting a name does not verify anyone’s identity.
      </p>
    </>
  );
}
