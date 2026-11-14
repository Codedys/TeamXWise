import type { CSSProperties } from 'react';
import {
  amountInMinorUnits,
  displayMoney,
  collectionQuestionsSummary,
  type CreateCollectionDraft,
} from './create-collection-draft';
import { evaluateOpenCollection } from './open-collection-rules';
import { shortDeadline } from './calendar-date';
import { InvitationMessageEditor } from './invitation-message-editor';
import styles from './create-collection-wizard.module.css';

export function OpenCollectionReview({
  draft,
  onMessageChange,
  messageError,
}: {
  draft: CreateCollectionDraft;
  onMessageChange: (value: string | null) => void;
  messageError?: string;
}) {
  const price = amountInMinorUnits(draft.amount) ?? 0;
  const headline = displayMoney(price, draft.currency);
  const capacity = evaluateOpenCollection(draft);
  const potential = displayMoney(capacity.maximumReceivableMinorUnits ?? 0, draft.currency);
  return (
    <div className={styles.reviewLayout}>
      <div className={styles.reviewCard}>
        <p className={styles.cardEyebrow}>CHIP IN OPEN LINK</p>
        <h2>{draft.title}</h2>
        <p
          className={styles.reviewTotal}
          style={{ '--amount-length': headline.length } as CSSProperties}
        >
          {headline}
        </p>
        <p className={styles.reviewCalculation}>
          {draft.limitType === 'spots'
            ? `per person, up to ${draft.spotLimit} spots`
            : draft.limitType === 'goal'
              ? 'per person, until the goal is reached'
              : 'per person, no limit on people'}
        </p>
        <div className={styles.reviewCardFooter}>
          <div className={styles.reviewOpenUntil}>
            <span>{draft.noDeadline ? 'Closes' : 'Open until'}</span>
            <strong>
              {draft.noDeadline
                ? draft.limitType === 'spots'
                  ? 'When full'
                  : draft.limitType === 'goal'
                    ? 'At the goal'
                    : 'You close it'
                : shortDeadline(draft.deadline)}
            </strong>
          </div>
          <div className={styles.reviewDeadline}>
            <span>
              {draft.limitType === 'spots'
                ? 'If it sells out'
                : draft.limitType === 'goal'
                  ? 'Goal'
                  : 'Capacity'}
            </span>
            <strong>
              {draft.limitType === 'spots'
                ? potential
                : draft.limitType === 'goal'
                  ? displayMoney(amountInMinorUnits(draft.goalAmount) ?? 0, draft.currency)
                  : 'No limit'}
            </strong>
          </div>
        </div>
      </div>
      <div className={styles.messagePreview}>
        <InvitationMessageEditor
          draft={draft}
          onChange={onMessageChange}
          error={messageError}
        />
        {draft.limitType === 'goal' && (
          <p className={styles.help}>
            At this fixed price, {capacity.remainingSpots}{' '}
            {capacity.remainingSpots === 1 ? 'person reaches' : 'people reach'} {potential}.
            The last full-price contribution can take you over the goal.
          </p>
        )}
        <div className={styles.reviewQuestions}>
          <h3>Questions at payment</h3>
          <p>
            {collectionQuestionsSummary(draft)}
            {draft.customQuestionEnabled ? ` · “${draft.customQuestion.trim()}”` : ''}
          </p>
        </div>
        <p className={styles.previewLabel}>
          Frontend preview · No live payment link is created yet.
        </p>
      </div>
    </div>
  );
}
