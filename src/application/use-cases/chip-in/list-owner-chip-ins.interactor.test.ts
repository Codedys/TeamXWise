import { describe, expect, it } from 'vitest';

import { InMemoryChipInRepository } from '@/adapters/gateways/in-memory-chip-in.repository';
import type { ChipInDashboardResponse } from '@/application/ports/output/chip-in-dashboard.dto';
import { PublishChipInInteractor } from './publish-chip-in.interactor';
import { ActivateChipInDashboardInteractor } from './activate-chip-in-dashboard.interactor';
import { ListOwnerChipInsInteractor } from './list-owner-chip-ins.interactor';

class FakeListOwnerChipInsPresenter {
  viewModel: ChipInDashboardResponse[] = [];

  present(dashboards: ChipInDashboardResponse[]): void {
    this.viewModel = dashboards;
  }
}

async function publishAndActivate(
  repository: InMemoryChipInRepository,
  id: string,
  ownerToken: string,
  activate: boolean,
) {
  await new PublishChipInInteractor(repository, {
    presentSuccess: () => {},
    presentError: () => {},
  }).execute({
    id,
    title: `Chip-in ${id}`,
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
  if (activate) {
    await new ActivateChipInDashboardInteractor(repository, {
      presentSuccess: () => {},
      presentError: () => {},
    }).execute({ id, ownerToken });
  }
}

describe('ListOwnerChipInsInteractor', () => {
  it('lists only the activated chip-ins owned by this token', async () => {
    const repository = new InMemoryChipInRepository();
    await publishAndActivate(repository, '11111111-1111-1111-1111-111111111111', 'owner-1', true);
    await publishAndActivate(
      repository,
      '22222222-2222-2222-2222-222222222222',
      'owner-1',
      false,
    );
    await publishAndActivate(
      repository,
      '33333333-3333-3333-3333-333333333333',
      'owner-2',
      true,
    );

    const presenter = new FakeListOwnerChipInsPresenter();
    await new ListOwnerChipInsInteractor(repository, presenter).execute({ ownerToken: 'owner-1' });

    expect(presenter.viewModel).toHaveLength(1);
    expect(presenter.viewModel[0]?.id).toBe('11111111-1111-1111-1111-111111111111');
  });
});
