export interface ConfirmBankTransferRequest {
  chipInId: string;
  receiptId: string;
  today: string;
  now: Date;
}

export interface ConfirmBankTransferInputPort {
  execute(request: ConfirmBankTransferRequest): Promise<void>;
}
