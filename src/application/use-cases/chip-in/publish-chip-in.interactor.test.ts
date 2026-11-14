import { describe, expect, it } from 'vitest';

import { DomainError } from '@/domain/errors/domain-error';
import { InMemoryChipInRepository } from '@/adapters/gateways/in-memory-chip-in.repository';
import type {
  ChipInResponse,
} from '@/application/ports/output/chip-in.dto';
import type { PublishChipInOutputPort } from '@/application/ports/output/publish-chip-in.output-port';
import { PublishChipInInteractor } from './publish-chip-in.interactor';

class FakePublishChipInPresenter implements PublishChipInOutputPort {
  successResponse: ChipInResponse | null = null;
  error: DomainError | null = null;

  presentSuccess(response: ChipInResponse): void {
    this.successResponse = response;
  }

  presentError(error: DomainError): void {
    this.error = error;
  }
}

const baseRequest = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Class trip to Rome',
  description: '',
  ownerName: 'John Doe',
  ownerToken: 'owner-token-1',
  priceMinorUnits: 6000,
  currency: 'EUR',
  deadline: null,
  limitType: 'none' as const,
  spotLimit: 80,
  goalMinorUnits: 120_000,
  collectEmail: false,
  customQuestion: null,
  invitationMessage: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('PublishChipInInteractor', () => {
  it('publishes a group chip-in with one participant per name', async () => {
    const repository = new InMemoryChipInRepository();
    const presenter = new FakePublishChipInPresenter();
    const interactor = new PublishChipInInteractor(repository, presenter);

    await interactor.execute({ ...baseRequest, audience: 'group', names: ['Ada', 'Grace'] });

    expect(presenter.error).toBeNull();
    expect(presenter.successResponse?.participants).toEqual([
      { id: expect.any(String), name: 'Ada', status: 'unpaid' },
      { id: expect.any(String), name: 'Grace', status: 'unpaid' },
    ]);
    expect(presenter.successResponse?.progress).toEqual({ paidSpots: 0, receivedMinorUnits: 0 });
  });

  it('publishes an open chip-in with no participants', async () => {
    const repository = new InMemoryChipInRepository();
    const presenter = new FakePublishChipInPresenter();
    const interactor = new PublishChipInInteractor(repository, presenter);

    await interactor.execute({ ...baseRequest, audience: 'anyone', names: [] });

    expect(presenter.successResponse?.participants).toEqual([]);
    expect(presenter.successResponse?.audience).toBe('anyone');
  });

  it('presents a domain error instead of throwing when the title is invalid', async () => {
    const repository = new InMemoryChipInRepository();
    const presenter = new FakePublishChipInPresenter();
    const interactor = new PublishChipInInteractor(repository, presenter);

    await interactor.execute({ ...baseRequest, audience: 'anyone', names: [], title: '   ' });

    expect(presenter.error).toBeInstanceOf(DomainError);
    expect(presenter.successResponse).toBeNull();
  });
});
