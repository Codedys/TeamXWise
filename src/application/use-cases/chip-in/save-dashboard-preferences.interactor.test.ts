import { beforeEach, describe, expect, it } from 'vitest';

import { DomainError } from '@/domain/errors/domain-error';
import { InMemoryChipInRepository } from '@/adapters/gateways/in-memory-chip-in.repository';
import { defaultDashboardPreferencesDto } from '@/application/ports/output/chip-in-dashboard.dto';
import type { ChipInDashboardResponse } from '@/application/ports/output/chip-in-dashboard.dto';
import { PublishChipInInteractor } from './publish-chip-in.interactor';
import { SaveDashboardPreferencesInteractor } from './save-dashboard-preferences.interactor';

class FakePresenter {
  successResponse: ChipInDashboardResponse | null = null;
  error: DomainError | null = null;

  presentSuccess(response: ChipInDashboardResponse): void {
    this.successResponse = response;
  }

  presentError(error: DomainError): void {
    this.error = error;
  }
}

const CHIP_IN_ID = '11111111-1111-1111-1111-111111111111';

describe('SaveDashboardPreferencesInteractor', () => {
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

  it('saves and returns the updated preferences', async () => {
    const presenter = new FakePresenter();
    await new SaveDashboardPreferencesInteractor(repository, presenter).execute({
      id: CHIP_IN_ID,
      ownerToken: 'owner-1',
      preferences: { ...defaultDashboardPreferencesDto(), cohosts: ['Alex'] },
    });
    expect(presenter.error).toBeNull();
    expect(presenter.successResponse?.preferences.cohosts).toEqual(['Alex']);
  });

  it("rejects saving another owner's preferences", async () => {
    const presenter = new FakePresenter();
    await new SaveDashboardPreferencesInteractor(repository, presenter).execute({
      id: CHIP_IN_ID,
      ownerToken: 'someone-else',
      preferences: defaultDashboardPreferencesDto(),
    });
    expect(presenter.error).toBeInstanceOf(DomainError);
    expect(presenter.successResponse).toBeNull();
  });
});
