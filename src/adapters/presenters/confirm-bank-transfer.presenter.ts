import type { DomainError } from '@/domain/errors/domain-error';
import type { PaymentReceiptResponse } from '@/application/ports/output/payment-receipt.dto';
import type { ConfirmBankTransferOutputPort } from '@/application/ports/output/confirm-bank-transfer.output-port';
import { toPaymentReceiptViewModel, type PaymentReceiptViewModel } from './payment-receipt.view-model';

export type ConfirmBankTransferViewModel =
  | { status: 'success'; receipt: PaymentReceiptViewModel }
  | { status: 'error'; message: string };

export class ConfirmBankTransferPresenter implements ConfirmBankTransferOutputPort {
  viewModel: ConfirmBankTransferViewModel | null = null;

  presentSuccess(response: PaymentReceiptResponse): void {
    this.viewModel = { status: 'success', receipt: toPaymentReceiptViewModel(response) };
  }

  presentError(error: DomainError): void {
    this.viewModel = { status: 'error', message: error.message };
  }
}
