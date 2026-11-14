import { beforeEach, describe, expect, it } from 'vitest';

import { DomainError } from '@/domain/errors/domain-error';
import { InMemoryChipInRepository } from '@/adapters/gateways/in-memory-chip-in.repository';
import type { PaymentReceiptResponse } from '@/application/ports/output/payment-receipt.dto';
import type { SubmitPaymentOutputPort } from '@/application/ports/output/submit-payment.output-port';
import type { ConfirmBankTransferOutputPort } from '@/application/ports/output/confirm-bank-transfer.output-port';
import { PublishChipInInteractor } from './publish-chip-in.interactor';
import { SubmitPaymentInteractor } from './submit-payment.interactor';
import { ConfirmBankTransferInteractor } from './confirm-bank-transfer.interactor';

class FakePresenter implements SubmitPaymentOutputPort, ConfirmBankTransferOutputPort {
  successResponse: PaymentReceiptResponse | null = null;
  error: DomainError | null = null;

  presentSuccess(response: PaymentReceiptResponse): void {
    this.successResponse = response;
  }

  presentError(error: DomainError): void {
    this.error = error;
  }
}

describe('ConfirmBankTransferInteractor', () => {
  let repository: InMemoryChipInRepository;

  beforeEach(() => {
    repository = new InMemoryChipInRepository();
  });

  it('confirms a pending bank transfer and applies it to progress', async () => {
    await new PublishChipInInteractor(repository, {
      presentSuccess: () => {},
      presentError: () => {},
    }).execute({
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Summer party',
      description: '',
      ownerName: 'John Doe',
      ownerToken: 'owner-token-1',
      audience: 'anyone',
      priceMinorUnits: 1000,
      currency: 'EUR',
      deadline: null,
      limitType: 'none',
      spotLimit: 80,
      goalMinorUnits: 120_000,
      collectEmail: false,
      customQuestion: null,
      invitationMessage: null,
      names: [],
      createdAt: new Date(),
    });

    const submitPresenter = new FakePresenter();
    await new SubmitPaymentInteractor(repository, submitPresenter).execute({
      chipInId: '11111111-1111-1111-1111-111111111111',
      receiptId: '33333333-3333-3333-3333-333333333333',
      requestId: 'request-1',
      participantId: null,
      payerName: 'Ada Lovelace',
      quantity: 1,
      currency: 'EUR',
      method: 'bank',
      email: '',
      answer: '',
      today: '2026-01-01',
    });
    expect(submitPresenter.successResponse?.status).toBe('pending');

    const confirmPresenter = new FakePresenter();
    await new ConfirmBankTransferInteractor(repository, confirmPresenter).execute({
      chipInId: '11111111-1111-1111-1111-111111111111',
      receiptId: '33333333-3333-3333-3333-333333333333',
      today: '2026-01-02',
    });

    expect(confirmPresenter.error).toBeNull();
    expect(confirmPresenter.successResponse?.status).toBe('paid');
  });
});
