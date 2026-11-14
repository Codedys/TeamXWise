export interface SubmitPaymentRequest {
  chipInId: string;
  receiptId: string;
  requestId: string;
  participantId: string | null;
  payerName: string;
  quantity: number;
  currency: string;
  method: 'instant' | 'bank';
  email: string;
  answer: string;
  expectedSourceMinorUnits?: number;
  today: string;
  now: Date;
}

export interface SubmitPaymentInputPort {
  execute(request: SubmitPaymentRequest): Promise<void>;
}
