import type { ChipInDashboardResponse } from '@/application/ports/output/chip-in-dashboard.dto';
import { toPaymentReceiptViewModel, type PaymentReceiptViewModel } from './payment-receipt.view-model';
import type { ChipInParticipantViewModel } from './chip-in-preview.view-model';

export interface DashboardPreferencesViewModel {
  rules: { id: 'week' | 'day' | 'due'; message: string }[];
  cohosts: string[];
  completionDismissed: boolean;
}

/** What the owner dashboard renders — shaped to match the existing display components exactly. */
export interface ChipInDashboardViewModel {
  id: string;
  title: string;
  isOpen: boolean;
  participants: ChipInParticipantViewModel[];
  payments: PaymentReceiptViewModel[];
  preferences: DashboardPreferencesViewModel;
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

export function toChipInDashboardViewModel(
  response: ChipInDashboardResponse,
): ChipInDashboardViewModel {
  return {
    id: response.id,
    title: response.title,
    isOpen: response.isOpen,
    participants: response.participants,
    payments: response.payments.map(toPaymentReceiptViewModel),
    preferences: response.preferences,
    invitationMessage: response.invitationMessage,
    audience: response.audience,
    currency: response.currency as 'EUR' | 'GBP' | 'USD',
    priceMinorUnits: response.priceMinorUnits,
    deadline: response.deadline,
    expectedCount: response.participants.length,
    limitType: response.limitType,
    spotLimit: response.spotLimit,
    goalMinorUnits: response.goalMinorUnits,
    customQuestion: response.customQuestion,
    paidCount: response.progress.paidSpots,
    collectedMinorUnits: response.progress.receivedMinorUnits,
    status: response.status,
  };
}
