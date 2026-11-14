import {
  emptyCollectionDraft,
  type CreateCollectionDraft,
} from '../create-collection/create-collection-draft';
import { evaluateOpenCollection } from '../create-collection/open-collection-rules';
import type { ChipInPreviewViewModel } from '@/adapters/presenters/chip-in-preview.view-model';

/** Adapts a chip-in into the shape `evaluateOpenCollection`'s capacity rule expects. */
export function previewRuleDraft(collection: ChipInPreviewViewModel): CreateCollectionDraft {
  return {
    ...emptyCollectionDraft(),
    audience: collection.audience,
    amount: (collection.priceMinorUnits / 100).toFixed(2),
    currency: collection.currency,
    deadline: collection.deadline ?? '',
    noDeadline: collection.deadline === null,
    limitType: collection.limitType,
    spotLimit: String(collection.spotLimit),
    goalAmount: (collection.goalMinorUnits / 100).toFixed(2),
  };
}

/** A client-side preview only — the server independently enforces this at submit time. */
export function previewClosedReason(
  collection: ChipInPreviewViewModel,
  today: string,
): string | null {
  if (!collection.isOpen) return 'The organiser has paused this link.';
  if (collection.deadline && today > collection.deadline) return 'This collection has closed.';
  if (collection.audience === 'anyone') {
    const result = evaluateOpenCollection(
      previewRuleDraft(collection),
      collection.progress,
      today,
    );
    if (result.closeReason === 'goal') return 'The goal has been reached. Thank you!';
    if (result.closeReason === 'spots') return 'All spots have been paid for.';
    if (!result.canContribute) return 'This collection is unavailable.';
  }
  return null;
}
