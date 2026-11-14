import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryChipInRepository } from '@/adapters/gateways/in-memory-chip-in.repository';
import type { PaymentReceiptResponse } from '@/application/ports/output/payment-receipt.dto';
import { GetPaymentReceiptInteractor } from './get-payment-receipt.interactor';

class FakeGetPaymentReceiptPresenter {
  viewModel: PaymentReceiptResponse | null = null;

  present(receipt: PaymentReceiptResponse | null): void {
    this.viewModel = receipt;
  }
}

describe('GetPaymentReceiptInteractor', () => {
  let repository: InMemoryChipInRepository;

  beforeEach(() => {
    repository = new InMemoryChipInRepository();
  });

  it('returns null when the chip-in id is malformed', async () => {
    const presenter = new FakeGetPaymentReceiptPresenter();
    await new GetPaymentReceiptInteractor(repository, presenter).execute({
      chipInId: 'not-a-uuid',
      receiptId: 'anything',
    });

    expect(presenter.viewModel).toBeNull();
  });

  it('returns null when the receipt does not exist', async () => {
    const presenter = new FakeGetPaymentReceiptPresenter();
    await new GetPaymentReceiptInteractor(repository, presenter).execute({
      chipInId: '11111111-1111-1111-1111-111111111111',
      receiptId: 'anything',
    });

    expect(presenter.viewModel).toBeNull();
  });
});
