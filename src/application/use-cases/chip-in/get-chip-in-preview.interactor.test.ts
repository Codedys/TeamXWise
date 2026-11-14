import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryChipInRepository } from '@/adapters/gateways/in-memory-chip-in.repository';
import type { ChipInResponse } from '@/application/ports/output/chip-in.dto';
import type { GetChipInPreviewOutputPort } from '@/application/ports/output/get-chip-in-preview.output-port';
import { PublishChipInInteractor } from './publish-chip-in.interactor';
import { GetChipInPreviewInteractor } from './get-chip-in-preview.interactor';

class FakeGetChipInPreviewPresenter implements GetChipInPreviewOutputPort {
  viewModel: ChipInResponse | null = null;

  present(chipIn: ChipInResponse | null): void {
    this.viewModel = chipIn;
  }
}

describe('GetChipInPreviewInteractor', () => {
  let repository: InMemoryChipInRepository;

  beforeEach(() => {
    repository = new InMemoryChipInRepository();
  });

  it('returns the published chip-in', async () => {
    await new PublishChipInInteractor(repository, { presentSuccess: () => {}, presentError: () => {} }).execute({
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Summer party',
      description: '',
      ownerName: 'John Doe',
      ownerToken: 'owner-token-1',
      audience: 'anyone',
      priceMinorUnits: 1500,
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

    const presenter = new FakeGetChipInPreviewPresenter();
    await new GetChipInPreviewInteractor(repository, presenter).execute({
      id: '11111111-1111-1111-1111-111111111111',
    });

    expect(presenter.viewModel?.title).toBe('Summer party');
  });

  it('returns null for an unknown id', async () => {
    const presenter = new FakeGetChipInPreviewPresenter();
    await new GetChipInPreviewInteractor(repository, presenter).execute({
      id: '22222222-2222-2222-2222-222222222222',
    });

    expect(presenter.viewModel).toBeNull();
  });

  it('returns null instead of throwing for a malformed id', async () => {
    const presenter = new FakeGetChipInPreviewPresenter();
    await new GetChipInPreviewInteractor(repository, presenter).execute({ id: 'not-a-uuid' });

    expect(presenter.viewModel).toBeNull();
  });
});
