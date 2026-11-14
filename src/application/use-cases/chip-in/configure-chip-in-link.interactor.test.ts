import { beforeEach, describe, expect, it } from 'vitest';

import { DomainError } from '@/domain/errors/domain-error';
import { InMemoryChipInRepository } from '@/adapters/gateways/in-memory-chip-in.repository';
import type { ChipInResponse } from '@/application/ports/output/chip-in.dto';
import { PublishChipInInteractor } from './publish-chip-in.interactor';
import { ConfigureChipInLinkInteractor } from './configure-chip-in-link.interactor';

class FakePresenter {
  successResponse: ChipInResponse | null = null;
  error: DomainError | null = null;

  presentSuccess(response: ChipInResponse): void {
    this.successResponse = response;
  }

  presentError(error: DomainError): void {
    this.error = error;
  }
}

const CHIP_IN_ID = '11111111-1111-1111-1111-111111111111';

describe('ConfigureChipInLinkInteractor', () => {
  let repository: InMemoryChipInRepository;

  beforeEach(async () => {
    repository = new InMemoryChipInRepository();
    await new PublishChipInInteractor(repository, {
      presentSuccess: () => {},
      presentError: () => {},
    }).execute({
      id: CHIP_IN_ID,
      title: 'Summer party',
      description: '',
      ownerName: 'John Doe',
      ownerToken: 'owner-1',
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
  });

  it('raises the price and closes the link', async () => {
    const presenter = new FakePresenter();
    await new ConfigureChipInLinkInteractor(repository, presenter).execute({
      id: CHIP_IN_ID,
      ownerToken: 'owner-1',
      isOpen: false,
      deadline: null,
      priceMinorUnits: 1500,
      limitType: 'none',
      spotLimit: 80,
      goalMinorUnits: 120_000,
      customQuestion: null,
      today: '2026-01-01',
    });
    expect(presenter.error).toBeNull();
    expect(presenter.successResponse?.isOpen).toBe(false);
    expect(presenter.successResponse?.priceMinorUnits).toBe(1500);
  });

  it('rejects lowering the price', async () => {
    const presenter = new FakePresenter();
    await new ConfigureChipInLinkInteractor(repository, presenter).execute({
      id: CHIP_IN_ID,
      ownerToken: 'owner-1',
      isOpen: true,
      deadline: null,
      priceMinorUnits: 500,
      limitType: 'none',
      spotLimit: 80,
      goalMinorUnits: 120_000,
      customQuestion: null,
      today: '2026-01-01',
    });
    expect(presenter.error).toBeInstanceOf(DomainError);
  });
});
