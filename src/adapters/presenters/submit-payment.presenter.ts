import type { DomainError } from '@/domain/errors/domain-error';
import type { PaymentReceiptResponse } from '@/application/ports/output/payment-receipt.dto';
import type { SubmitPaymentOutputPort } from '@/application/ports/output/submit-payment.output-port';
import { toPaymentReceiptViewModel, type PaymentReceiptViewModel } from './payment-receipt.view-model';

export type SubmitPaymentViewModel =
  | { status: 'success'; receipt: PaymentReceiptViewModel }
  | { status: 'error'; message: string };

export class SubmitPaymentPresenter implements SubmitPaymentOutputPort {
  viewModel: SubmitPaymentViewModel | null = null;

  presentSuccess(response: PaymentReceiptResponse): void {
    this.viewModel = { status: 'success', receipt: toPaymentReceiptViewModel(response) };
  }

  presentError(error: DomainError): void {
    this.viewModel = { status: 'error', message: error.message };
  }
}
