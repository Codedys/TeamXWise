import 'server-only';

import { CreateCollectionController } from '@/adapters/controllers/create-collection.controller';
import { ListCollectionsController } from '@/adapters/controllers/list-collections.controller';
import { DrizzleCollectionRepository } from '@/adapters/gateways/drizzle-collection.repository';
import { InMemoryCollectionRepository } from '@/adapters/gateways/in-memory-collection.repository';
import { CreateCollectionPresenter } from '@/adapters/presenters/create-collection.presenter';
import { ListCollectionsPresenter } from '@/adapters/presenters/list-collections.presenter';
import type { CollectionRepository } from '@/application/ports/repositories/collection.repository';
import { CreateCollectionInteractor } from '@/application/use-cases/collections/create-collection.interactor';
import { ListCollectionsInteractor } from '@/application/use-cases/collections/list-collections.interactor';
import { loadEnv } from '@/infrastructure/config/env';
import { createDrizzleClient } from '@/infrastructure/db/client';

/**
 * Composition root: the only place concrete classes from every ring are
 * wired together. Nothing outside this file is allowed to `new` a gateway,
 * an interactor, or a presenter.
 *
 * The repository is a singleton for the lifetime of the server process, so
 * data created by one Server Action call is visible to the next. Controllers
 * are built fresh per call because their presenter holds per-call state.
 */

let cachedRepository: CollectionRepository | undefined;

function getCollectionRepository(): CollectionRepository {
  if (cachedRepository) {
    return cachedRepository;
  }

  const env = loadEnv();

  cachedRepository =
    env.DATA_SOURCE === 'postgres'
      ? new DrizzleCollectionRepository(createDrizzleClient(env.DATABASE_URL!))
      : new InMemoryCollectionRepository();

  return cachedRepository;
}

export function getCreateCollectionController(): CreateCollectionController {
  const presenter = new CreateCollectionPresenter();
  const interactor = new CreateCollectionInteractor(getCollectionRepository(), presenter);
  return new CreateCollectionController(interactor, presenter);
}

export function getListCollectionsController(): ListCollectionsController {
  const presenter = new ListCollectionsPresenter();
  const interactor = new ListCollectionsInteractor(getCollectionRepository(), presenter);
  return new ListCollectionsController(interactor, presenter);
}
