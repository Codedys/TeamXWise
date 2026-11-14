import type { PaymentReceiptResponse } from '@/application/ports/output/payment-receipt.dto';

export interface PaymentReceiptViewModel {
  id: string;
  requestId: string;
  participantId: string | null;
  payerName: string;
  quantity: number;
  sourceMinorUnits: number;
  sourceCurrency: string;
  payMinorUnits: number;
  payCurrency: string;
  rate: number;
  method: 'instant' | 'bank';
  status: 'pending' | 'paid';
}

export function toPaymentReceiptViewModel(response: PaymentReceiptResponse): PaymentReceiptViewModel {
  return { ...response };
}
