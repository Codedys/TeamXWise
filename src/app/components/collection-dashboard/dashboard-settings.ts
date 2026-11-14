import { z } from 'zod';
import { shortDeadline } from '../create-collection/calendar-date';

export const reminderRuleSchema = z.object({
  id: z.enum(['week', 'day', 'due']),
  message: z.string().trim().min(1).max(1000),
});
export const dashboardPreferencesSchema = z.object({
  rules: z.array(reminderRuleSchema).length(3),
  cohosts: z.array(z.string().trim().min(1).max(100)).max(10),
  completionDismissed: z.boolean(),
});
export type DashboardPreferences = z.infer<typeof dashboardPreferencesSchema>;
export function defaultDashboardPreferences(): DashboardPreferences {
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
export const REMINDER_LABELS = {
  week: 'Friendly reminder',
  day: 'Last call',
  due: 'Due today',
} as const;
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

/** A copied reminder always includes the payment link, even after editing the template. */
export function copyableReminder(
  template: string,
  fields: Parameters<typeof reminderPreview>[1],
) {
  const message = reminderPreview(template, fields).trim();
  return message.includes(fields.url) ? message : `${message}\n${fields.url}`;
}
