import { DomainError } from './domain-error';

export type ChipInClosedReason = 'manual' | 'date';

/** The link itself is unavailable — the organiser paused it, or its deadline passed. */
export class ChipInClosedError extends DomainError {
  readonly code = 'CHIP_IN_CLOSED';

  constructor(reason: ChipInClosedReason) {
    super(
      reason === 'manual'
        ? 'The organiser has paused this link.'
        : 'This collection has closed.',
    );
  }
}
