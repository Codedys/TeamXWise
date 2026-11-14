/** Shared response shape — a single contribution receipt. */
export interface PaymentReceiptResponse {
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
