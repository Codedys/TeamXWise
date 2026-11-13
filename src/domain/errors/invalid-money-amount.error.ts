import { DomainError } from './domain-error';

export class InvalidMoneyAmountError extends DomainError {
  readonly code = 'INVALID_MONEY_AMOUNT';

  constructor(amountMinorUnits: number) {
    super(
      `Money amount is invalid: ${amountMinorUnits} must be a positive integer (minor units)`,
    );
  }
}
