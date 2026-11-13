import { DomainError } from './domain-error';

export class InvalidCurrencyCodeError extends DomainError {
  readonly code = 'INVALID_CURRENCY_CODE';

  constructor(value: string) {
    super(`Currency code is invalid: "${value}" must be a 3-letter ISO 4217 code`);
  }
}
