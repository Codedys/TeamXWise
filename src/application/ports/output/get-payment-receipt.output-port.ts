import type { PaymentReceiptResponse } from './payment-receipt.dto';

export interface GetPaymentReceiptOutputPort {
  present(receipt: PaymentReceiptResponse | null): void;
}
