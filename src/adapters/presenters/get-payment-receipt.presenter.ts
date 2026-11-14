import type { PaymentReceiptResponse } from '@/application/ports/output/payment-receipt.dto';
import type { GetPaymentReceiptOutputPort } from '@/application/ports/output/get-payment-receipt.output-port';
import { toPaymentReceiptViewModel, type PaymentReceiptViewModel } from './payment-receipt.view-model';

export type GetPaymentReceiptViewModel = PaymentReceiptViewModel | null;

export class GetPaymentReceiptPresenter implements GetPaymentReceiptOutputPort {
  viewModel: GetPaymentReceiptViewModel = null;

  present(receipt: PaymentReceiptResponse | null): void {
    this.viewModel = receipt ? toPaymentReceiptViewModel(receipt) : null;
  }
}
