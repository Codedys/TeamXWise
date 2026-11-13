import { DomainError } from './domain-error';

export class InvalidCollectionIdError extends DomainError {
  readonly code = 'INVALID_COLLECTION_ID';

  constructor(value: string) {
    super(`Collection id is invalid: "${value}" is not a UUID`);
  }
}
