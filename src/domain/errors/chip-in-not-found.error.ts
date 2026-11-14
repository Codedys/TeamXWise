import { DomainError } from './domain-error';

export class ChipInNotFoundError extends DomainError {
  readonly code = 'CHIP_IN_NOT_FOUND';

  constructor() {
    super('This demo link has expired, is complete, or is not saved in this browser.');
  }
}
