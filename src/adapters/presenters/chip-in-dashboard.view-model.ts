import type { ChipInDashboardResponse } from '@/application/ports/output/chip-in-dashboard.dto';

export interface DashboardPreferencesViewModel {
  remindersEnabled: boolean;
  rules: { id: 'week' | 'day' | 'due'; enabled: boolean; message: string }[];
  contacts: Record<string, string>;
  cohosts: string[];
  exceptionResolved: boolean;
  completionDismissed: boolean;
}

/** What the owner dashboard renders — shaped to match the existing display components exactly. */
export interface ChipInDashboardViewModel {
  id: string;
  title: string;
  isOpen: boolean;
  samplePaidCount: number | null;
  statisticsPriceMinorUnits: number | null;
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
    // Fixture-blending for display richness recomputes from current fields every time —
    // see collection-dashboard-model.ts — so these are never persisted.
    samplePaidCount: null,
    statisticsPriceMinorUnits: null,
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
