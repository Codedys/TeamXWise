import { InvalidCurrencyCodeError } from '../errors/invalid-currency-code.error';
import { InvalidMoneyAmountError } from '../errors/invalid-money-amount.error';

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

/** Amounts are stored in minor units (e.g. cents) to avoid floating-point drift. */
export class Money {
  private constructor(
    private readonly amountMinorUnits: number,
    private readonly currencyCode: string,
  ) {}

  static create(amountMinorUnits: number, currencyCode: string): Money {
    if (!Number.isInteger(amountMinorUnits) || amountMinorUnits <= 0) {
      throw new InvalidMoneyAmountError(amountMinorUnits);
    }
    if (!CURRENCY_CODE_PATTERN.test(currencyCode)) {
      throw new InvalidCurrencyCodeError(currencyCode);
    }
    return new Money(amountMinorUnits, currencyCode);
  }

  get minorUnits(): number {
    return this.amountMinorUnits;
  }

  get currency(): string {
    return this.currencyCode;
  }

  equals(other: Money): boolean {
    return (
      this.amountMinorUnits === other.amountMinorUnits &&
      this.currencyCode === other.currencyCode
    );
  }
}
