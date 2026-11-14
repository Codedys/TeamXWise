import { describe, expect, it } from 'vitest';
import {
  defaultDashboardPreferences,
  nextReminderDate,
  reminderPreview,
} from './dashboard-settings';
import { dashboardCsv } from './dashboard-export';
describe('dashboard reminder schedules and export', () => {
  it('selects the next enabled calendar-day reminder and respects pausing', () => {
    const settings = defaultDashboardPreferences();
    expect(nextReminderDate(settings, '2026-11-28', '2026-11-14')).toBe('2026-11-21');
    expect(nextReminderDate(settings, '2026-11-28', '2026-11-22')).toBe('2026-11-27');
    settings.rules[1].enabled = false;
    expect(nextReminderDate(settings, '2026-11-28', '2026-11-22')).toBeNull();
    settings.remindersEnabled = false;
    expect(nextReminderDate(settings, '2026-11-28', '2026-11-14')).toBeNull();
    expect(nextReminderDate(defaultDashboardPreferences(), null, '2026-11-14')).toBeNull();
  });
  it('renders editable reminder tokens without changing the saved template', () => {
    const template = 'Hi [name]! [amount] for [occasion] by [date]. [link]';
    expect(
      reminderPreview(template, {
        name: 'Hugo Mets',
        amount: '€60',
        occasion: 'Rome',
        deadline: '2026-11-28',
        url: 'https://example.com/pay',
      }),
    ).toBe('Hi Hugo! €60 for Rome by 28 Nov. https://example.com/pay');
    expect(template).toContain('[name]');
  });
  it('escapes CSV text, including commas, newlines, quotes and spreadsheet formulas', () => {
    expect(
      dashboardCsv([
        ['Name', 'Answer'],
        ['Mari, Lill', 'Said "yes"\nThanks'],
        ['=1+1', 2],
      ]),
    ).toBe('"Name","Answer"\r\n"Mari, Lill","Said ""yes""\nThanks"\r\n"\'=1+1","2"');
  });
});
