import type { ChipInResponse } from './chip-in.dto';
import type { PaymentReceiptResponse } from './payment-receipt.dto';

export interface ReminderRuleDto {
  id: 'week' | 'day' | 'due';
  message: string;
}

/** Owner-only UI convenience data — no money invariants, so it isn't part of the ChipIn entity. */
export interface DashboardPreferencesDto {
  rules: ReminderRuleDto[];
  cohosts: string[];
  completionDismissed: boolean;
}

export function defaultDashboardPreferencesDto(): DashboardPreferencesDto {
  return {
    cohosts: [],
    completionDismissed: false,
    rules: [
      {
        id: 'week',
        message: 'Hi [name], please chip in [amount] for [occasion] by [date]. [link]',
      },
      {
        id: 'day',
        message: 'Hi [name], last call: [occasion] closes tomorrow. Chip in here: [link]',
      },
      {
        id: 'due',
        message: 'Today is the last day to chip in for [occasion]. [link]',
      },
    ],
  };
}

export interface ChipInDashboardResponse extends ChipInResponse {
  preferences: DashboardPreferencesDto;
  isActivated: boolean;
  status: 'active' | 'complete';
  /** The owner sees every payer's own receipt — names, answers, quantities. */
  payments: PaymentReceiptResponse[];
}
