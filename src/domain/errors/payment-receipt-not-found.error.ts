import { DomainError } from './domain-error';

export class PaymentReceiptNotFoundError extends DomainError {
  readonly code = 'PAYMENT_RECEIPT_NOT_FOUND';

  constructor() {
    super('Demo transfer not found.');
  }
}
