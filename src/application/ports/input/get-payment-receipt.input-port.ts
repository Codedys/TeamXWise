export interface GetPaymentReceiptRequest {
  chipInId: string;
  receiptId: string;
}

export interface GetPaymentReceiptInputPort {
  execute(request: GetPaymentReceiptRequest): Promise<void>;
}
