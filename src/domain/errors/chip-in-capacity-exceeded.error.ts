import { DomainError } from './domain-error';

export type ChipInLimitType = 'spots' | 'goal';

/** No spots or goal headroom remain for this contribution. */
export class ChipInCapacityExceededError extends DomainError {
  readonly code = 'CHIP_IN_CAPACITY_EXCEEDED';

  constructor(limitType: ChipInLimitType) {
    super(
      limitType === 'goal'
        ? 'The goal has been reached. Thank you!'
        : 'All spots have been paid for.',
    );
  }
}
