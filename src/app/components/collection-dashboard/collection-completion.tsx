'use client';
import Image from 'next/image';
import { CollectionConfetti } from '../celebration/collection-confetti';
import celebration from '../celebration/collection-confetti.module.css';
import { DashboardBalancePanel } from './dashboard-balance-panel';
import Link from 'next/link';
import { useState } from 'react';
import type { CollectionDashboard } from './collection-dashboard-client';
import { dashboardModel, initials } from './collection-dashboard-model';
import { displayMoney } from '../create-collection/create-collection-draft';
import { DeleteCollectionButton } from './delete-collection-button';
import styles from './collection-completion.module.css';

export function CollectionCompletion({
  collection,
  preview,
  onKeep,
}: {
  collection: CollectionDashboard;
  preview: boolean;
  onKeep: () => void;
}) {
  const model = dashboardModel(collection);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const count = preview ? (model.target ?? model.paid) : model.paid;
  const total = preview ? model.total + model.outstanding : model.total;
  return (
    <div className={styles.wrapper}>
      <section className={styles.completion} aria-labelledby="collection-complete-heading">
        <div className={styles.topline}>
          <Link href="/">← Back to account</Link>
          <span>{preview ? 'COMPLETION PREVIEW' : 'DEMO COLLECTION COMPLETE'}</span>
        </div>
        <CollectionConfetti />
        <div className={styles.content}>
          <div className={`${styles.artwork} ${celebration.bounce}`}>
            <Image
              src="/images/chip-in-filled-jar.png"
              width={1102}
              height={1427}
              sizes="620px"
              alt=""
            />
          </div>
          <div className={styles.copy}>
            <h1 id="collection-complete-heading">
              {model.group ? (
                <>
                  {count} OUT
                  <br />
                  OF {model.target ?? count}.
                </>
              ) : (
                'GOAL REACHED.'
              )}
            </h1>
            <p>
              {model.group ? 'Everyone has chipped in for' : 'The collection is complete for'}{' '}
              {collection.title}.
            </p>
            <div className={styles.avatars} aria-label="Your group">
              {model.people.slice(0, 15).map((person) => (
                <span key={person.id} title={person.name}>
                  {initials(person.name)}
                </span>
              ))}
              {model.people.length > 15 && <span>+{model.people.length - 15}</span>}
            </div>
            <div className={styles.total}>
              <strong>{displayMoney(total, collection.currency)}</strong>
              <span>Collected for your group. No one left to chase.</span>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                disabled={preview || model.available === 0}
                onClick={() => setBalanceOpen(true)}
              >
                Pay a bill
              </button>
              <button type="button" className={styles.keep} onClick={onKeep}>
                Keep it for now · View dashboard
              </button>
            </div>
            <p className={styles.status} role="status">
              {preview ? 'Finish the collection to use the saved balance.' : ''}
            </p>
          </div>
        </div>
      </section>
      {balanceOpen && (
        <DashboardBalancePanel collection={collection} onClose={() => setBalanceOpen(false)} />
      )}
      <DeleteCollectionButton collectionId={collection.id} />
    </div>
  );
}
