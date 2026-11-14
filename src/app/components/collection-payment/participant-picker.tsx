'use client';
import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import type { ChipInPreviewViewModel } from '@/adapters/presenters/chip-in-preview.view-model';
import styles from './collection-payment.module.css';

export function ParticipantPicker({
  collection,
  onPick,
}: {
  collection: ChipInPreviewViewModel;
  onPick: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [gridRef] = useAutoAnimate({ duration: 150 });
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
      <div ref={gridRef} className={styles.nameGrid}>
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
      <p className={styles.demoNote}>Selecting a name does not verify anyone’s identity.</p>
    </>
  );
}
