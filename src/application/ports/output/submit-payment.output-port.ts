import type { DomainError } from '@/domain/errors/domain-error';
import type { PaymentReceiptResponse } from './payment-receipt.dto';

export interface SubmitPaymentOutputPort {
  presentSuccess(response: PaymentReceiptResponse): void;
  presentError(error: DomainError): void;
}
