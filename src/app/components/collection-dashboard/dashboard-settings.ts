import { z } from 'zod';
import { dateFromInput, shortDeadline } from '../create-collection/calendar-date';
import { localDateInput } from '../create-collection/create-collection-draft';

export const reminderRuleSchema = z.object({
  id: z.enum(['week', 'day', 'due']),
  enabled: z.boolean(),
  message: z.string().trim().min(1).max(1000),
});
export const dashboardPreferencesSchema = z.object({
  remindersEnabled: z.boolean(),
  rules: z.array(reminderRuleSchema).length(3),
  contacts: z.record(z.string(), z.string().max(30)),
  cohosts: z.array(z.string().trim().min(1).max(100)).max(10),
  exceptionResolved: z.boolean(),
  completionDismissed: z.boolean(),
});
export type DashboardPreferences = z.infer<typeof dashboardPreferencesSchema>;
export function defaultDashboardPreferences(): DashboardPreferences {
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
export const REMINDER_LABELS = {
  week: 'A week before',
  day: 'The day before',
  due: 'On the due date',
} as const;
export function reminderDate(
  deadline: string | null,
  id: 'week' | 'day' | 'due',
): string | null {
  if (!deadline) return null;
  const date = dateFromInput(deadline);
  if (!date) return null;
  date.setDate(date.getDate() - (id === 'week' ? 7 : id === 'day' ? 1 : 0));
  return localDateInput(date);
}
export function nextReminderDate(
  preferences: DashboardPreferences,
  deadline: string | null,
  today: string,
): string | null {
  if (!preferences.remindersEnabled) return null;
  return (
    preferences.rules
      .filter((rule) => rule.enabled)
      .map((rule) => reminderDate(deadline, rule.id))
      .filter((date): date is string => !!date && date >= today)
      .sort()[0] ?? null
  );
}
export function reminderPreview(
  template: string,
  fields: {
    name: string;
    amount: string;
    occasion: string;
    deadline: string | null;
    url: string;
  },
): string {
  return Object.entries({
    name: fields.name.split(' ')[0],
    amount: fields.amount,
    occasion: fields.occasion,
    date: fields.deadline ? shortDeadline(fields.deadline) : 'the closing date',
    link: fields.url,
  }).reduce((text, [key, value]) => text.replaceAll(`[${key}]`, value), template);
}
