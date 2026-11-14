import { DomainError } from './domain-error';

/** A contribution request's shape or state is invalid — reason is the exact user-facing message. */
export class InvalidContributionError extends DomainError {
  readonly code = 'INVALID_CONTRIBUTION';

  constructor(reason: string) {
    super(reason);
  }
}
