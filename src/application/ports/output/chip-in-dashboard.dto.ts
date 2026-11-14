import type { ChipInResponse } from './chip-in.dto';

export interface ReminderRuleDto {
  id: 'week' | 'day' | 'due';
  enabled: boolean;
  message: string;
}

/** Owner-only UI convenience data — no money invariants, so it isn't part of the ChipIn entity. */
export interface DashboardPreferencesDto {
  remindersEnabled: boolean;
  rules: ReminderRuleDto[];
  contacts: Record<string, string>;
  cohosts: string[];
  exceptionResolved: boolean;
  completionDismissed: boolean;
}

export function defaultDashboardPreferencesDto(): DashboardPreferencesDto {
  return {
    remindersEnabled: true,
    contacts: {},
    cohosts: [],
    exceptionResolved: false,
    completionDismissed: false,
    rules: [
      {
        id: 'week',
        enabled: true,
        message:
          'Hi [name], a week to go! Please chip in [amount] for [occasion] by [date]. [link]',
      },
      {
        id: 'day',
        enabled: true,
        message: 'Hi [name], last call: [occasion] closes tomorrow. Chip in here: [link]',
      },
      {
        id: 'due',
        enabled: false,
        message: 'Today is the last day to chip in for [occasion]. [link]',
      },
    ],
  };
}

export interface ChipInDashboardResponse extends ChipInResponse {
  preferences: DashboardPreferencesDto;
  isActivated: boolean;
  status: 'active' | 'complete';
}
