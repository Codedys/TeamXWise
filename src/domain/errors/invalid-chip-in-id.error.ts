import { DomainError } from './domain-error';

export class InvalidChipInIdError extends DomainError {
  readonly code = 'INVALID_CHIP_IN_ID';

  constructor(value: string) {
    super(`Chip-in id is invalid: "${value}" is not a UUID`);
  }
}
