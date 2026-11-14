'use client';

import { WiseCheck } from '../icons/wise-check';

import { suggestCollectionAudience, type CollectionAudience } from './create-collection-draft';
import styles from './create-collection-wizard.module.css';

const OPTIONS = [
  {
    value: 'group',
    title: 'A set group of people',
    description: 'You know who’s in. You add their names next.',
  },
  {
    value: 'anyone',
    title: 'Anyone with the link',
    description: 'You don’t know who’ll join. People add their own name when they pay.',
  },
] as const;

export function CollectionAudienceStep({
  title,
  value,
  onChange,
}: {
  title: string;
  value: CollectionAudience;
  onChange: (audience: CollectionAudience) => void;
}) {
  const suggested = suggestCollectionAudience(title);
  return (
    <>
      <p className={styles.description}>
        For “{title}”, we picked the one that usually fits. Click the other if we got it wrong.
      </p>
      <fieldset className={styles.audienceOptions} aria-label="Who can chip in">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className={styles.audienceOption}
            data-selected={value === option.value}
          >
            <input
              type="radio"
              name="audience"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className={styles.audienceOptionHeader}>
              <span className={styles.audienceRadio} aria-hidden="true">
                {value === option.value ? <WiseCheck /> : null}
              </span>
              <strong>{option.title}</strong>
              {option.value === suggested && (
                <span className={styles.suggestedBadge}>Suggested</span>
              )}
            </span>
            <span className={styles.audienceOptionDescription}>{option.description}</span>
          </label>
        ))}
      </fieldset>
      <p className={styles.audienceHelp}>You can change this later.</p>
    </>
  );
}
