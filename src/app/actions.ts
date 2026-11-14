'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import type { CreateCollectionViewModel } from '@/adapters/presenters/create-collection.presenter';
import type { ListCollectionsViewModel } from '@/adapters/presenters/list-collections.presenter';
import type { PublishChipInViewModel } from '@/adapters/presenters/publish-chip-in.presenter';
import type { GetChipInPreviewViewModel } from '@/adapters/presenters/get-chip-in-preview.presenter';
import type { GetPaymentReceiptViewModel } from '@/adapters/presenters/get-payment-receipt.presenter';
import type { SubmitPaymentViewModel } from '@/adapters/presenters/submit-payment.presenter';
import type { ConfirmBankTransferViewModel } from '@/adapters/presenters/confirm-bank-transfer.presenter';
import {
  getCreateCollectionController,
  getListCollectionsController,
  getPublishChipInController,
  getGetChipInPreviewController,
  getGetPaymentReceiptController,
  getSubmitPaymentController,
  getConfirmBankTransferController,
} from '@/infrastructure/di/container';

const OWNER_TOKEN_COOKIE = 'chip-in-owner-token';

/** Anonymous, no-login ownership: whoever's browser holds this cookie owns the dashboards it created. */
async function getOrCreateOwnerToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(OWNER_TOKEN_COOKIE)?.value;
  if (existing) return existing;
  const token = crypto.randomUUID();
  store.set(OWNER_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });
  return token;
}

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

export interface PublishChipInActionInput {
  title: string;
  description: string;
  audience: 'group' | 'anyone';
  amount: string;
  currency: string;
  deadline: string | null;
  limitType: 'none' | 'spots' | 'goal';
  spotLimit: string;
  goalAmount: string;
  collectEmail: boolean;
  customQuestion: string | null;
  invitationMessage: string | null;
  names: string[];
}

export async function publishChipInAction(
  input: PublishChipInActionInput,
): Promise<PublishChipInViewModel> {
  const ownerToken = await getOrCreateOwnerToken();
  const controller = getPublishChipInController();
  return controller.handle({ ...input, ownerToken });
}

export async function getChipInPreviewAction(id: string): Promise<GetChipInPreviewViewModel> {
  const controller = getGetChipInPreviewController();
  return controller.handle({ id });
}

export async function getPaymentReceiptAction(
  chipInId: string,
  receiptId: string,
): Promise<GetPaymentReceiptViewModel> {
  const controller = getGetPaymentReceiptController();
  return controller.handle({ chipInId, receiptId });
}

export interface SubmitPaymentActionInput {
  chipInId: string;
  requestId: string;
  participantId: string | null;
  payerName: string;
  quantity: number;
  currency: string;
  method: 'instant' | 'bank';
  email: string;
  answer: string;
  expectedSourceMinorUnits?: number;
}

export async function submitPaymentAction(
  input: SubmitPaymentActionInput,
): Promise<SubmitPaymentViewModel> {
  const controller = getSubmitPaymentController();
  return controller.handle(input);
}

export async function confirmBankTransferAction(
  chipInId: string,
  receiptId: string,
): Promise<ConfirmBankTransferViewModel> {
  const controller = getConfirmBankTransferController();
  return controller.handle({ chipInId, receiptId });
}
