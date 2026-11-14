import { z } from 'zod';
import type { CreateCollectionDraft } from '../create-collection/create-collection-draft';

const currency = z.enum(['EUR', 'GBP', 'USD']);
export const participantPreviewSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  status: z.enum(['unpaid', 'pending', 'paid']),
});
export const collectionPreviewSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(120),
  description: z.string().max(1000),
  ownerName: z.string(),
  isOpen: z.boolean().default(true),
  invitationMessage: z.string().max(2000).nullable().default(null),
  audience: z.enum(['group', 'anyone']),
  currency,
  priceMinorUnits: z.number().int().positive().max(100_000_000),
  deadline: z.string().nullable(),
  limitType: z.enum(['none', 'spots', 'goal']),
  spotLimit: z.number().int().positive().max(1_000_000),
  goalMinorUnits: z.number().int().positive(),
  collectEmail: z.boolean(),
  customQuestion: z.string().max(200).nullable(),
  participants: z.array(participantPreviewSchema).max(500),
  progress: z.object({
    paidSpots: z.number().int().nonnegative(),
    receivedMinorUnits: z.number().int().nonnegative(),
  }),
});
export const paymentReceiptPreviewSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  participantId: z.string().nullable(),
  payerName: z.string(),
  quantity: z.number().int().positive(),
  sourceMinorUnits: z.number().int().positive(),
  sourceCurrency: currency,
  payMinorUnits: z.number().int().positive(),
  payCurrency: currency,
  rate: z.number().positive(),
  method: z.enum(['instant', 'bank']),
  status: z.enum(['pending', 'paid']),
});
export type CollectionPreview = z.infer<typeof collectionPreviewSchema>;
export type ParticipantPreview = z.infer<typeof participantPreviewSchema>;
export type PaymentReceiptPreview = z.infer<typeof paymentReceiptPreviewSchema>;
export type PreviewCurrency = CollectionPreview['currency'];
export interface QuotePreview {
  sourceMinorUnits: number;
  sourceCurrency: PreviewCurrency;
  payMinorUnits: number;
  payCurrency: PreviewCurrency;
  rate: number;
}
export interface PaymentPreviewRequest {
  collectionId: string;
  expectedSourceMinorUnits?: number;
  requestId: string;
  participantId?: string;
  payerName: string;
  quantity: number;
  email: string;
  answer: string;
  currency: PreviewCurrency;
  method: 'instant' | 'bank';
}
/** UI contract only. A backend implementation will call server actions and map presenter ViewModels here. */
export interface CollectionLinkSettings {
  isOpen: boolean;
  deadline: string | null;
  priceMinorUnits: number;
  limitType: CollectionPreview['limitType'];
  spotLimit: number;
  goalMinorUnits: number;
  customQuestion: string | null;
}
export interface CollectionPreviewClient {
  configure(
    collectionId: string,
    settings: CollectionLinkSettings,
  ): Promise<CollectionPreview>;
  publish(draft: CreateCollectionDraft): Promise<CollectionPreview>;
  remove(collectionId: string): Promise<void>;
  get(collectionId: string): Promise<CollectionPreview | null>;
  quote(
    collectionId: string,
    currency: PreviewCurrency,
    quantity: number,
  ): Promise<QuotePreview>;
  submit(request: PaymentPreviewRequest): Promise<PaymentReceiptPreview>;
  receipt(collectionId: string, receiptId: string): Promise<PaymentReceiptPreview | null>;
  confirmBankTransfer(collectionId: string, receiptId: string): Promise<PaymentReceiptPreview>;
  subscribe(onChange: () => void): () => void;
}
