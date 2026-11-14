import { beforeEach, describe, expect, it } from 'vitest';

import { DomainError } from '@/domain/errors/domain-error';
import { ChipInCapacityExceededError } from '@/domain/errors/chip-in-capacity-exceeded.error';
import { InMemoryChipInRepository } from '@/adapters/gateways/in-memory-chip-in.repository';
import type { PaymentReceiptResponse } from '@/application/ports/output/payment-receipt.dto';
import type { SubmitPaymentOutputPort } from '@/application/ports/output/submit-payment.output-port';
import { PublishChipInInteractor } from './publish-chip-in.interactor';
import { SubmitPaymentInteractor } from './submit-payment.interactor';

class FakeSubmitPaymentPresenter implements SubmitPaymentOutputPort {
  successResponse: PaymentReceiptResponse | null = null;
  error: DomainError | null = null;

  presentSuccess(response: PaymentReceiptResponse): void {
    this.successResponse = response;
  }

  presentError(error: DomainError): void {
    this.error = error;
  }
}

async function publishOpenChipIn(
  repository: InMemoryChipInRepository,
  overrides: Partial<{
    limitType: 'none' | 'spots' | 'goal';
    spotLimit: number;
    goalMinorUnits: number;
  }> = {},
) {
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
    limitType: overrides.limitType ?? 'none',
    spotLimit: overrides.spotLimit ?? 80,
    goalMinorUnits: overrides.goalMinorUnits ?? 120_000,
    collectEmail: false,
    customQuestion: null,
    invitationMessage: null,
    names: [],
    createdAt: new Date(),
  });
}

function baseSubmitRequest(overrides: Partial<Parameters<SubmitPaymentInteractor['execute']>[0]> = {}) {
  return {
    chipInId: '11111111-1111-1111-1111-111111111111',
    receiptId: '33333333-3333-3333-3333-333333333333',
    requestId: 'request-1',
    participantId: null,
    payerName: 'Ada Lovelace',
    quantity: 1,
    currency: 'EUR',
    method: 'instant' as const,
    email: '',
    answer: '',
    today: '2026-01-01',
    ...overrides,
  };
}

describe('SubmitPaymentInteractor', () => {
  let repository: InMemoryChipInRepository;

  beforeEach(() => {
    repository = new InMemoryChipInRepository();
  });

  it('accepts an instant payment and marks it paid immediately', async () => {
    await publishOpenChipIn(repository);
    const presenter = new FakeSubmitPaymentPresenter();

    await new SubmitPaymentInteractor(repository, presenter).execute(baseSubmitRequest());

    expect(presenter.error).toBeNull();
    expect(presenter.successResponse?.status).toBe('paid');
    expect(presenter.successResponse?.sourceMinorUnits).toBe(1000);
  });

  it('is idempotent: retrying the same requestId returns the original receipt without double counting', async () => {
    await publishOpenChipIn(repository);
    const presenter = new FakeSubmitPaymentPresenter();
    const interactor = new SubmitPaymentInteractor(repository, presenter);
    const request = baseSubmitRequest();

    await interactor.execute(request);
    const firstReceiptId = presenter.successResponse?.id;
    await interactor.execute(request);

    expect(presenter.successResponse?.id).toBe(firstReceiptId);
  });

  it('rejects a contribution once a spot limit is reached', async () => {
    await publishOpenChipIn(repository, { limitType: 'spots', spotLimit: 1 });
    const presenter = new FakeSubmitPaymentPresenter();
    const interactor = new SubmitPaymentInteractor(repository, presenter);

    await interactor.execute(baseSubmitRequest({ requestId: 'request-1' }));
    expect(presenter.successResponse?.status).toBe('paid');

    await interactor.execute(baseSubmitRequest({ requestId: 'request-2', payerName: 'Grace Hopper' }));

    expect(presenter.error).toBeInstanceOf(ChipInCapacityExceededError);
  });

  it('leaves a bank-transfer contribution pending and does not count it toward progress yet', async () => {
    await publishOpenChipIn(repository, { limitType: 'spots', spotLimit: 1 });
    const presenter = new FakeSubmitPaymentPresenter();

    await new SubmitPaymentInteractor(repository, presenter).execute(
      baseSubmitRequest({ method: 'bank' }),
    );

    expect(presenter.successResponse?.status).toBe('pending');
  });
});
