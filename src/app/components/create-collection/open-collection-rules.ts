import { dateFromInput } from './calendar-date';
import {
  amountInMinorUnits,
  COLLECTION_STEP,
  validateDraftStep,
  type CreateCollectionDraft,
} from './create-collection-draft';

/** Only successful payments count. Pending/failed payments must not consume capacity. */
export interface OpenCollectionProgress {
  paidSpots: number;
  receivedMinorUnits: number;
  manuallyClosed?: boolean;
}
export type OpenCollectionCloseReason = 'manual' | 'date' | 'spots' | 'goal' | 'invalid';

/** Frontend rule preview. The backend must enforce the same rules atomically at payment time. */
export function evaluateOpenCollection(
  draft: CreateCollectionDraft,
  progress: OpenCollectionProgress = { paidSpots: 0, receivedMinorUnits: 0 },
  today?: string,
  quantity = 1,
): {
  remainingSpots: number | null;
  closeReason: OpenCollectionCloseReason | null;
  canContribute: boolean;
  maximumReceivableMinorUnits: number | null;
} {
  const price = amountInMinorUnits(draft.amount);
  let closeReason: OpenCollectionCloseReason | null = null;
  let remainingSpots: number | null = null;
  const validProgress = [progress.paidSpots, progress.receivedMinorUnits].every(
    (value) => Number.isSafeInteger(value) && value >= 0,
  );
  if (
    draft.audience !== 'anyone' ||
    !validProgress ||
    price === null ||
    Object.keys(validateDraftStep(COLLECTION_STEP.limit, draft)).length
  )
    closeReason = 'invalid';
  else if (
    today &&
    (!dateFromInput(today) || (!draft.noDeadline && !dateFromInput(draft.deadline)))
  )
    closeReason = 'invalid';
  else if (progress.manuallyClosed) closeReason = 'manual';
  else if (today && !draft.noDeadline && draft.deadline && today > draft.deadline)
    closeReason = 'date';
  else if (draft.limitType === 'spots') {
    remainingSpots = Math.max(0, Number(draft.spotLimit) - progress.paidSpots);
    if (remainingSpots === 0) closeReason = 'spots';
  } else if (draft.limitType === 'goal') {
    const goal = amountInMinorUnits(draft.goalAmount)!;
    remainingSpots = Math.max(0, Math.ceil((goal - progress.receivedMinorUnits) / price));
    if (remainingSpots === 0) closeReason = 'goal';
  }
  const validQuantity =
    Number.isSafeInteger(quantity) &&
    quantity > 0 &&
    price !== null &&
    Number.isSafeInteger(quantity * price) &&
    Number.isSafeInteger(progress.receivedMinorUnits + quantity * price);
  const maximum =
    closeReason === null && remainingSpots !== null
      ? progress.receivedMinorUnits + remainingSpots * (price ?? 0)
      : null;
  return {
    remainingSpots,
    closeReason,
    canContribute:
      closeReason === null &&
      validQuantity &&
      (remainingSpots === null || quantity <= remainingSpots),
    maximumReceivableMinorUnits:
      maximum !== null && Number.isSafeInteger(maximum) ? maximum : null,
  };
}
