import {
  participantPreviewSchema,
  paymentReceiptPreviewSchema,
  type CollectionPreview,
  type PaymentReceiptPreview,
} from '../collection-preview/collection-preview-client';
import {
  dashboardPreferencesSchema,
  defaultDashboardPreferences,
  type DashboardPreferences,
} from './dashboard-settings';
import { z } from 'zod';

export const disbursementSchema = z.object({
  requestId: z.string().min(1),
  kind: z.enum(['bill', 'withdrawal']),
  amountMinorUnits: z.number().int().positive().safe(),
  recipient: z.string().trim().min(1).max(120),
  reference: z.string().trim().max(200),
});
export type DisbursementRequest = z.infer<typeof disbursementSchema>;
export type Disbursement = DisbursementRequest & { createdAt: number };

export const collectionDashboardSchema = z.object({
  id: z.string(),
  title: z.string(),
  isOpen: z.boolean().default(true),
  participants: participantPreviewSchema.array().default([]),
  payments: paymentReceiptPreviewSchema.array().default([]),
  disbursements: disbursementSchema.extend({ createdAt: z.number() }).array().default([]),
  preferences: dashboardPreferencesSchema.default(defaultDashboardPreferences),
  invitationMessage: z.string().max(2000).nullable().default(null),
  audience: z.enum(['group', 'anyone']),
  currency: z.enum(['EUR', 'GBP', 'USD']),
  priceMinorUnits: z.number().int().positive(),
  deadline: z.string().nullable(),
  expectedCount: z.number().int().nonnegative(),
  limitType: z.enum(['none', 'spots', 'goal']),
  spotLimit: z.number().int().positive(),
  goalMinorUnits: z.number().int().positive(),
  customQuestion: z.string().nullable(),
  paidCount: z.number().int().nonnegative(),
  collectedMinorUnits: z.number().int().nonnegative(),
  expiresAt: z.number(),
  visible: z.boolean(),
  status: z.enum(['active', 'complete', 'expired']),
});
export type CollectionDashboard = z.infer<typeof collectionDashboardSchema>;
/** Local owner view contract. Replace this browser implementation when the backend is ready. */
export interface CollectionDashboardClient {
  remember(collection: CollectionPreview, expiresAt: number): void;
  savePreferences(id: string, preferences: DashboardPreferences): void;
  remove(id: string): void;
  activate(id: string): void;
  update(collection: CollectionPreview, payments?: PaymentReceiptPreview[]): void;
  disburse(id: string, request: DisbursementRequest): Disbursement;
  close(id: string, status: 'complete' | 'expired'): void;
  list(): CollectionDashboard[];
  get(id: string): CollectionDashboard | null;
  subscribe(listener: () => void): () => void;
}
