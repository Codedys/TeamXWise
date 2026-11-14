import 'server-only';

import { CreateCollectionController } from '@/adapters/controllers/create-collection.controller';
import { ListCollectionsController } from '@/adapters/controllers/list-collections.controller';
import { PublishChipInController } from '@/adapters/controllers/publish-chip-in.controller';
import { GetChipInPreviewController } from '@/adapters/controllers/get-chip-in-preview.controller';
import { GetPaymentReceiptController } from '@/adapters/controllers/get-payment-receipt.controller';
import { SubmitPaymentController } from '@/adapters/controllers/submit-payment.controller';
import { ConfirmBankTransferController } from '@/adapters/controllers/confirm-bank-transfer.controller';
import { GetChipInDashboardController } from '@/adapters/controllers/get-chip-in-dashboard.controller';
import { ListOwnerChipInsController } from '@/adapters/controllers/list-owner-chip-ins.controller';
import { SaveDashboardPreferencesController } from '@/adapters/controllers/save-dashboard-preferences.controller';
import { ActivateChipInDashboardController } from '@/adapters/controllers/activate-chip-in-dashboard.controller';
import { RemoveChipInController } from '@/adapters/controllers/remove-chip-in.controller';
import { ConfigureChipInLinkController } from '@/adapters/controllers/configure-chip-in-link.controller';
import { DrizzleCollectionRepository } from '@/adapters/gateways/drizzle-collection.repository';
import { InMemoryCollectionRepository } from '@/adapters/gateways/in-memory-collection.repository';
import { DrizzleChipInRepository } from '@/adapters/gateways/drizzle-chip-in.repository';
import { InMemoryChipInRepository } from '@/adapters/gateways/in-memory-chip-in.repository';
import { CreateCollectionPresenter } from '@/adapters/presenters/create-collection.presenter';
import { ListCollectionsPresenter } from '@/adapters/presenters/list-collections.presenter';
import { PublishChipInPresenter } from '@/adapters/presenters/publish-chip-in.presenter';
import { GetChipInPreviewPresenter } from '@/adapters/presenters/get-chip-in-preview.presenter';
import { GetPaymentReceiptPresenter } from '@/adapters/presenters/get-payment-receipt.presenter';
import { SubmitPaymentPresenter } from '@/adapters/presenters/submit-payment.presenter';
import { ConfirmBankTransferPresenter } from '@/adapters/presenters/confirm-bank-transfer.presenter';
import { GetChipInDashboardPresenter } from '@/adapters/presenters/get-chip-in-dashboard.presenter';
import { ListOwnerChipInsPresenter } from '@/adapters/presenters/list-owner-chip-ins.presenter';
import { SaveDashboardPreferencesPresenter } from '@/adapters/presenters/save-dashboard-preferences.presenter';
import { ActivateChipInDashboardPresenter } from '@/adapters/presenters/activate-chip-in-dashboard.presenter';
import { RemoveChipInPresenter } from '@/adapters/presenters/remove-chip-in.presenter';
import { ConfigureChipInLinkPresenter } from '@/adapters/presenters/configure-chip-in-link.presenter';
import type { CollectionRepository } from '@/application/ports/repositories/collection.repository';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';
import { CreateCollectionInteractor } from '@/application/use-cases/collections/create-collection.interactor';
import { ListCollectionsInteractor } from '@/application/use-cases/collections/list-collections.interactor';
import { PublishChipInInteractor } from '@/application/use-cases/chip-in/publish-chip-in.interactor';
import { GetChipInPreviewInteractor } from '@/application/use-cases/chip-in/get-chip-in-preview.interactor';
import { GetPaymentReceiptInteractor } from '@/application/use-cases/chip-in/get-payment-receipt.interactor';
import { SubmitPaymentInteractor } from '@/application/use-cases/chip-in/submit-payment.interactor';
import { ConfirmBankTransferInteractor } from '@/application/use-cases/chip-in/confirm-bank-transfer.interactor';
import { GetChipInDashboardInteractor } from '@/application/use-cases/chip-in/get-chip-in-dashboard.interactor';
import { ListOwnerChipInsInteractor } from '@/application/use-cases/chip-in/list-owner-chip-ins.interactor';
import { SaveDashboardPreferencesInteractor } from '@/application/use-cases/chip-in/save-dashboard-preferences.interactor';
import { ActivateChipInDashboardInteractor } from '@/application/use-cases/chip-in/activate-chip-in-dashboard.interactor';
import { RemoveChipInInteractor } from '@/application/use-cases/chip-in/remove-chip-in.interactor';
import { ConfigureChipInLinkInteractor } from '@/application/use-cases/chip-in/configure-chip-in-link.interactor';
import { loadEnv } from '@/infrastructure/config/env';
import { createDrizzleClient } from '@/infrastructure/db/client';

/**
 * Composition root: the only place concrete classes from every ring are
 * wired together. Nothing outside this file is allowed to `new` a gateway,
 * an interactor, or a presenter.
 *
 * Repositories are singletons for the lifetime of the server process, so
 * data created by one Server Action call is visible to the next. Controllers
 * are built fresh per call because their presenter holds per-call state.
 */

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
let cachedDrizzleClient: DrizzleClient | undefined;

function getDrizzleClient(): DrizzleClient {
  if (!cachedDrizzleClient) {
    const env = loadEnv();
    cachedDrizzleClient = createDrizzleClient(env.DATABASE_URL!);
  }
  return cachedDrizzleClient;
}

let cachedRepository: CollectionRepository | undefined;

function getCollectionRepository(): CollectionRepository {
  if (cachedRepository) {
    return cachedRepository;
  }

  const env = loadEnv();

  cachedRepository =
    env.DATA_SOURCE === 'postgres'
      ? new DrizzleCollectionRepository(getDrizzleClient())
      : new InMemoryCollectionRepository();

  return cachedRepository;
}

let cachedChipInRepository: ChipInRepository | undefined;

function getChipInRepository(): ChipInRepository {
  if (cachedChipInRepository) {
    return cachedChipInRepository;
  }

  const env = loadEnv();

  cachedChipInRepository =
    env.DATA_SOURCE === 'postgres'
      ? new DrizzleChipInRepository(getDrizzleClient())
      : new InMemoryChipInRepository();

  return cachedChipInRepository;
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

export function getPublishChipInController(): PublishChipInController {
  const presenter = new PublishChipInPresenter();
  const interactor = new PublishChipInInteractor(getChipInRepository(), presenter);
  return new PublishChipInController(interactor, presenter);
}

export function getGetChipInPreviewController(): GetChipInPreviewController {
  const presenter = new GetChipInPreviewPresenter();
  const interactor = new GetChipInPreviewInteractor(getChipInRepository(), presenter);
  return new GetChipInPreviewController(interactor, presenter);
}

export function getGetPaymentReceiptController(): GetPaymentReceiptController {
  const presenter = new GetPaymentReceiptPresenter();
  const interactor = new GetPaymentReceiptInteractor(getChipInRepository(), presenter);
  return new GetPaymentReceiptController(interactor, presenter);
}

export function getSubmitPaymentController(): SubmitPaymentController {
  const presenter = new SubmitPaymentPresenter();
  const interactor = new SubmitPaymentInteractor(getChipInRepository(), presenter);
  return new SubmitPaymentController(interactor, presenter);
}

export function getConfirmBankTransferController(): ConfirmBankTransferController {
  const presenter = new ConfirmBankTransferPresenter();
  const interactor = new ConfirmBankTransferInteractor(getChipInRepository(), presenter);
  return new ConfirmBankTransferController(interactor, presenter);
}

export function getGetChipInDashboardController(): GetChipInDashboardController {
  const presenter = new GetChipInDashboardPresenter();
  const interactor = new GetChipInDashboardInteractor(getChipInRepository(), presenter);
  return new GetChipInDashboardController(interactor, presenter);
}

export function getListOwnerChipInsController(): ListOwnerChipInsController {
  const presenter = new ListOwnerChipInsPresenter();
  const interactor = new ListOwnerChipInsInteractor(getChipInRepository(), presenter);
  return new ListOwnerChipInsController(interactor, presenter);
}

export function getSaveDashboardPreferencesController(): SaveDashboardPreferencesController {
  const presenter = new SaveDashboardPreferencesPresenter();
  const interactor = new SaveDashboardPreferencesInteractor(getChipInRepository(), presenter);
  return new SaveDashboardPreferencesController(interactor, presenter);
}

export function getActivateChipInDashboardController(): ActivateChipInDashboardController {
  const presenter = new ActivateChipInDashboardPresenter();
  const interactor = new ActivateChipInDashboardInteractor(getChipInRepository(), presenter);
  return new ActivateChipInDashboardController(interactor, presenter);
}

export function getRemoveChipInController(): RemoveChipInController {
  const presenter = new RemoveChipInPresenter();
  const interactor = new RemoveChipInInteractor(getChipInRepository(), presenter);
  return new RemoveChipInController(interactor, presenter);
}

export function getConfigureChipInLinkController(): ConfigureChipInLinkController {
  const presenter = new ConfigureChipInLinkPresenter();
  const interactor = new ConfigureChipInLinkInteractor(getChipInRepository(), presenter);
  return new ConfigureChipInLinkController(interactor, presenter);
}
