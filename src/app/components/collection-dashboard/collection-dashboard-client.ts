import type { DashboardPreferences } from './dashboard-settings';

/** The owner dashboard's view of a chip-in — now sourced from Server Actions, not a browser store. */
export interface CollectionDashboard {
  id: string;
  title: string;
  isOpen: boolean;
  samplePaidCount: number | null;
  statisticsPriceMinorUnits: number | null;
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
