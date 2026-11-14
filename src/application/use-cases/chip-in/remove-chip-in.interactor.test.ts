import { beforeEach, describe, expect, it } from 'vitest';

import { DomainError } from '@/domain/errors/domain-error';
import { InMemoryChipInRepository } from '@/adapters/gateways/in-memory-chip-in.repository';
import { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import { PublishChipInInteractor } from './publish-chip-in.interactor';
import { RemoveChipInInteractor } from './remove-chip-in.interactor';

class FakePresenter {
  succeeded = false;
  error: DomainError | null = null;

  presentSuccess(): void {
    this.succeeded = true;
  }

  presentError(error: DomainError): void {
    this.error = error;
  }
}

const CHIP_IN_ID = '11111111-1111-1111-1111-111111111111';

describe('RemoveChipInInteractor', () => {
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

  it('removes a chip-in its owner deletes', async () => {
    const presenter = new FakePresenter();
    await new RemoveChipInInteractor(repository, presenter).execute({
      id: CHIP_IN_ID,
      ownerToken: 'owner-1',
    });
    expect(presenter.succeeded).toBe(true);
    await expect(repository.findById(ChipInId.create(CHIP_IN_ID))).resolves.toBeNull();
  });

  it("refuses to remove another owner's chip-in", async () => {
    const presenter = new FakePresenter();
    await new RemoveChipInInteractor(repository, presenter).execute({
      id: CHIP_IN_ID,
      ownerToken: 'someone-else',
    });
    expect(presenter.error).toBeInstanceOf(DomainError);
    await expect(repository.findById(ChipInId.create(CHIP_IN_ID))).resolves.not.toBeNull();
  });
});
