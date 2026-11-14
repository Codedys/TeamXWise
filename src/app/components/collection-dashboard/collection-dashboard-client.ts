import type { DashboardPreferences } from './dashboard-settings';
import type { ChipInParticipantViewModel } from '@/adapters/presenters/chip-in-preview.view-model';
import type { PaymentReceiptViewModel } from '@/adapters/presenters/payment-receipt.view-model';

/** The one feature not wired to the real backend yet — kept local-only, see local-disbursements.ts. */
export interface DisbursementRequest {
  requestId: string;
  kind: 'bill' | 'withdrawal';
  amountMinorUnits: number;
  recipient: string;
  reference: string;
}
export type Disbursement = DisbursementRequest & { createdAt: number };

/** The owner dashboard's view of a chip-in — sourced from Server Actions, not a browser store. */
export interface CollectionDashboard {
  id: string;
  title: string;
  isOpen: boolean;
  participants: ChipInParticipantViewModel[];
  payments: PaymentReceiptViewModel[];
  /** Local-only stub — never persisted to Neon. See local-disbursements.ts. */
  disbursements: Disbursement[];
  preferences: DashboardPreferences;
  invitationMessage: string | null;
  audience: 'group' | 'anyone';
  currency: 'EUR' | 'GBP' | 'USD';
  priceMinorUnits: number;
  deadline: string | null;
  expectedCount: number;
  limitType: 'none' | 'spots' | 'goal';
  spotLimit: number;
  goalMinorUnits: number;
  customQuestion: string | null;
  paidCount: number;
  collectedMinorUnits: number;
  status: 'active' | 'complete';
}
