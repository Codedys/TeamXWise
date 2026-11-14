import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryChipInRepository } from '@/adapters/gateways/in-memory-chip-in.repository';
import type { ChipInDashboardResponse } from '@/application/ports/output/chip-in-dashboard.dto';
import { PublishChipInInteractor } from './publish-chip-in.interactor';
import { ActivateChipInDashboardInteractor } from './activate-chip-in-dashboard.interactor';
import { GetChipInDashboardInteractor } from './get-chip-in-dashboard.interactor';

class FakeGetChipInDashboardPresenter {
  viewModel: ChipInDashboardResponse | null = null;

  present(dashboard: ChipInDashboardResponse | null): void {
    this.viewModel = dashboard;
  }
}

const CHIP_IN_ID = '11111111-1111-1111-1111-111111111111';

async function publish(repository: InMemoryChipInRepository, ownerToken: string) {
  await new PublishChipInInteractor(repository, {
    presentSuccess: () => {},
    presentError: () => {},
  }).execute({
    id: CHIP_IN_ID,
    title: 'Summer party',
    description: '',
    ownerName: 'John Doe',
    ownerToken,
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
}

describe('GetChipInDashboardInteractor', () => {
  let repository: InMemoryChipInRepository;

  beforeEach(() => {
    repository = new InMemoryChipInRepository();
  });

  it('returns null before the owner activates the dashboard', async () => {
    await publish(repository, 'owner-1');
    const presenter = new FakeGetChipInDashboardPresenter();
    await new GetChipInDashboardInteractor(repository, presenter).execute({
      id: CHIP_IN_ID,
      ownerToken: 'owner-1',
    });
    expect(presenter.viewModel).toBeNull();
  });

  it('returns the dashboard once activated by its owner', async () => {
    await publish(repository, 'owner-1');
    await new ActivateChipInDashboardInteractor(repository, {
      presentSuccess: () => {},
      presentError: () => {},
    }).execute({ id: CHIP_IN_ID, ownerToken: 'owner-1' });

    const presenter = new FakeGetChipInDashboardPresenter();
    await new GetChipInDashboardInteractor(repository, presenter).execute({
      id: CHIP_IN_ID,
      ownerToken: 'owner-1',
    });
    expect(presenter.viewModel?.title).toBe('Summer party');
    expect(presenter.viewModel?.status).toBe('active');
  });

  it("never returns another owner's dashboard", async () => {
    await publish(repository, 'owner-1');
    await new ActivateChipInDashboardInteractor(repository, {
      presentSuccess: () => {},
      presentError: () => {},
    }).execute({ id: CHIP_IN_ID, ownerToken: 'owner-1' });

    const presenter = new FakeGetChipInDashboardPresenter();
    await new GetChipInDashboardInteractor(repository, presenter).execute({
      id: CHIP_IN_ID,
      ownerToken: 'someone-else',
    });
    expect(presenter.viewModel).toBeNull();
  });
});
