import type { CollectionPreview } from '../collection-preview/collection-preview-client';
import {
  dashboardPreferencesSchema,
  defaultDashboardPreferences,
  type DashboardPreferences,
} from './dashboard-settings';
import { z } from 'zod';

export const collectionDashboardSchema = z.object({
  id: z.string(),
  title: z.string(),
  isOpen: z.boolean().default(true),
  samplePaidCount: z.number().int().nonnegative().nullable().default(null),
  statisticsPriceMinorUnits: z.number().int().positive().nullable().default(null),
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
/** Frontend summary contract. Contains no payer names, receipts, emails or answers. */
export interface CollectionDashboardClient {
  remember(collection: CollectionPreview, expiresAt: number): void;
  savePreferences(id: string, preferences: DashboardPreferences): void;
  remove(id: string): void;
  activate(id: string): void;
  update(collection: CollectionPreview): void;
  close(id: string, status: 'complete' | 'expired'): void;
  list(): CollectionDashboard[];
  get(id: string): CollectionDashboard | null;
  subscribe(listener: () => void): () => void;
}
