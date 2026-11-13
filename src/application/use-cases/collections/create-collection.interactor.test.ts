import { beforeEach, describe, expect, it } from 'vitest';

import { DomainError } from '@/domain/errors/domain-error';
import { InMemoryCollectionRepository } from '@/adapters/gateways/in-memory-collection.repository';
import type {
  CreateCollectionOutputPort,
  CreateCollectionResponse,
} from '@/application/ports/output/create-collection.output-port';
import { CreateCollectionInteractor } from './create-collection.interactor';

class FakeCreateCollectionPresenter implements CreateCollectionOutputPort {
  successResponse: CreateCollectionResponse | null = null;
  error: DomainError | null = null;

  presentSuccess(response: CreateCollectionResponse): void {
    this.successResponse = response;
  }

  presentError(error: DomainError): void {
    this.error = error;
  }
}

describe('CreateCollectionInteractor', () => {
  let repository: InMemoryCollectionRepository;
  let presenter: FakeCreateCollectionPresenter;
  let interactor: CreateCollectionInteractor;

  beforeEach(() => {
    repository = new InMemoryCollectionRepository();
    presenter = new FakeCreateCollectionPresenter();
    interactor = new CreateCollectionInteractor(repository, presenter);
  });

  it('saves a valid collection and presents success', async () => {
    await interactor.execute({
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Ski trip 2026',
      targetAmountMinorUnits: 50000,
      currency: 'EUR',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(presenter.successResponse).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Ski trip 2026',
      targetAmountMinorUnits: 50000,
      currency: 'EUR',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    await expect(repository.findAll()).resolves.toHaveLength(1);
  });

  it('presents a domain error instead of throwing when the title is invalid', async () => {
    await interactor.execute({
      id: '11111111-1111-1111-1111-111111111111',
      title: '   ',
      targetAmountMinorUnits: 50000,
      currency: 'EUR',
      createdAt: new Date(),
    });

    expect(presenter.error).toBeInstanceOf(DomainError);
    expect(presenter.successResponse).toBeNull();
    await expect(repository.findAll()).resolves.toHaveLength(0);
  });
});
