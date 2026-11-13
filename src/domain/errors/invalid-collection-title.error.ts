import { DomainError } from './domain-error';

export class InvalidCollectionTitleError extends DomainError {
  readonly code = 'INVALID_COLLECTION_TITLE';

  constructor(reason: string) {
    super(`Collection title is invalid: ${reason}`);
  }
}
