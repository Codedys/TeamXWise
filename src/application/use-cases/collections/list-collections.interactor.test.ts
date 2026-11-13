import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryCollectionRepository } from '@/adapters/gateways/in-memory-collection.repository';
import type {
  CollectionListItem,
  ListCollectionsOutputPort,
} from '@/application/ports/output/list-collections.output-port';
import { CreateCollectionInteractor } from './create-collection.interactor';
import { ListCollectionsInteractor } from './list-collections.interactor';

class SpyPresenter implements ListCollectionsOutputPort {
  presented: CollectionListItem[] | null = null;

  present(collections: CollectionListItem[]): void {
    this.presented = collections;
  }
}

describe('ListCollectionsInteractor', () => {
  let repository: InMemoryCollectionRepository;
  let presenter: SpyPresenter;

  beforeEach(() => {
    repository = new InMemoryCollectionRepository();
    presenter = new SpyPresenter();
  });

  it('presents an empty list when nothing was created yet', async () => {
    await new ListCollectionsInteractor(repository, presenter).execute();

    expect(presenter.presented).toEqual([]);
  });

  it('presents collections created through the create use case', async () => {
    const noopPresenter = { presentSuccess: () => {}, presentError: () => {} };
    await new CreateCollectionInteractor(repository, noopPresenter).execute({
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Ski trip 2026',
      targetAmountMinorUnits: 50000,
      currency: 'EUR',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await new ListCollectionsInteractor(repository, presenter).execute();

    expect(presenter.presented).toEqual([
      {
        id: '11111111-1111-1111-1111-111111111111',
        title: 'Ski trip 2026',
        targetAmountMinorUnits: 50000,
        currency: 'EUR',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
  });
});
