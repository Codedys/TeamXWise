'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { browserCollectionDashboardClient } from './browser-collection-dashboard-client';
import type { CollectionDashboard } from './collection-dashboard-client';
import { browserCollectionPreviewClient } from '../collection-preview/browser-collection-preview-client';
import { displayMoney } from '../create-collection/create-collection-draft';
import { dashboardModel } from './collection-dashboard-model';
import styles from './collection-dashboard.module.css';

export function CollectionCards() {
  const [collections, setCollections] = useState<CollectionDashboard[]>([]);
  useEffect(() => {
    const refresh = () => setCollections(browserCollectionDashboardClient.list());
    refresh();
    const owner = browserCollectionDashboardClient.subscribe(refresh);
    const payments = browserCollectionPreviewClient.subscribe(refresh);
    return () => {
      owner();
      payments();
    };
  }, []);
  if (!collections.length) return null;
  return (
    <section className={styles.homeCollections} aria-labelledby="chip-in-collections-heading">
      <div className={styles.homeHeader}>
        <h2 id="chip-in-collections-heading">Your Chip ins</h2>
        <span>Mock dashboards</span>
      </div>
      <div className={styles.homeGrid}>
        {collections.map((collection) => {
          const model = dashboardModel(collection);
          return (
            <Link
              key={collection.id}
              className={styles.homeCard}
              href={`/chip-in/collections/${encodeURIComponent(collection.id)}`}
            >
              <span className={styles.homeTag}>
                CHIP IN <span>↗</span>
              </span>
              <h3>{collection.title}</h3>
              <strong>{displayMoney(model.total, collection.currency)}</strong>
              <span>
                {model.paid}
                {model.target ? ` of ${model.target}` : ''}{' '}
                {model.group ? 'paid' : 'people joined'}
              </span>
              <span className={styles.homeTrack}>
                <span style={{ width: `${model.percentage ?? 100}%` }} />
              </span>
              <small>
                {collection.status === 'complete'
                  ? 'Complete'
                  : collection.status === 'expired'
                    ? 'Link expired'
                    : !collection.isOpen
                      ? 'Link paused'
                      : 'View dashboard'}{' '}
                · sample statistics
              </small>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
