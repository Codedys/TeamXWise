export interface ConfirmBankTransferRequest {
  chipInId: string;
  receiptId: string;
  today: string;
}

export interface ConfirmBankTransferInputPort {
  execute(request: ConfirmBankTransferRequest): Promise<void>;
}
