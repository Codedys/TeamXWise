'use server';

import { revalidatePath } from 'next/cache';

import type { CreateCollectionViewModel } from '@/adapters/presenters/create-collection.presenter';
import type { ListCollectionsViewModel } from '@/adapters/presenters/list-collections.presenter';
import {
  getCreateCollectionController,
  getListCollectionsController,
} from '@/infrastructure/di/container';

/**
 * Server Actions are the ONLY entry point for mutations and queries from the
 * UI. Each one is thin: pull raw input, hand it to a controller from the
 * composition root, return the ViewModel. No business logic lives here.
 */

export async function createCollectionAction(
  _previousState: CreateCollectionViewModel | null,
  formData: FormData,
): Promise<CreateCollectionViewModel> {
  const controller = getCreateCollectionController();
  const viewModel = await controller.handle({
    title: formData.get('title'),
    targetAmount: formData.get('targetAmount'),
    currency: formData.get('currency'),
  });

  if (viewModel.status === 'success') {
    revalidatePath('/');
  }

  return viewModel;
}

export async function listCollectionsAction(): Promise<ListCollectionsViewModel> {
  const controller = getListCollectionsController();
  return controller.handle();
}
