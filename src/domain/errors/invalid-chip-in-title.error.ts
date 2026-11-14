import { DomainError } from './domain-error';

export class InvalidChipInTitleError extends DomainError {
  readonly code = 'INVALID_CHIP_IN_TITLE';

  constructor(reason: string) {
    super(`Chip-in title is invalid: ${reason}`);
  }
}
