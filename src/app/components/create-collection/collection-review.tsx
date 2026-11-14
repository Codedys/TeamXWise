import { OpenCollectionReview } from './open-collection-review';
import type { CSSProperties } from 'react';
import {
  amountInMinorUnits,
  displayMoney,
  draftNames,
  type CreateCollectionDraft,
} from './create-collection-draft';
import { shortDeadline } from './calendar-date';
import { InvitationMessageEditor } from './invitation-message-editor';
import styles from './create-collection-wizard.module.css';

export function CollectionReview({
  draft,
  onMessageChange,
  messageError,
}: {
  draft: CreateCollectionDraft;
  onMessageChange: (value: string | null) => void;
  messageError?: string;
}) {
  if (draft.audience === 'anyone')
    return (
      <OpenCollectionReview
        draft={draft}
        onMessageChange={onMessageChange}
        messageError={messageError}
      />
    );
  const names = draftNames(draft.names);
  const amount = amountInMinorUnits(draft.amount) ?? 0;
  const headlineAmount = displayMoney(amount * Number(draft.peopleCount), draft.currency);
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase();
  return (
    <div className={styles.reviewLayout}>
      <div className={styles.reviewCard}>
        <p className={styles.cardEyebrow}>CHIP IN</p>
        <h2>{draft.title}</h2>
        <p
          className={styles.reviewTotal}
          style={{ '--amount-length': headlineAmount.length } as CSSProperties}
        >
          {headlineAmount}
        </p>
        <p className={styles.reviewCalculation}>
          {draft.peopleCount} people × {displayMoney(amount, draft.currency)}
        </p>
        <div className={styles.reviewCardFooter}>
          <div className={styles.avatars} aria-label={`${names.length} named participants`}>
            {names.slice(0, 4).map((name, i) => (
              <span key={i} aria-label={name}>
                {initials(name)}
              </span>
            ))}
            {names.length > 4 && <span>+{names.length - 4}</span>}
          </div>
          <div className={styles.reviewDeadline}>
            <span>Pay by</span>
            <strong>{draft.noDeadline ? 'No deadline' : shortDeadline(draft.deadline)}</strong>
          </div>
        </div>
      </div>
      <div className={styles.messagePreview}>
        <InvitationMessageEditor
          draft={draft}
          onChange={onMessageChange}
          error={messageError}
        />
        <p className={styles.previewLabel}>Frontend preview · Nothing is sent yet.</p>
      </div>
    </div>
  );
}
