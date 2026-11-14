import { describe, expect, it } from 'vitest';
import {
  defaultDashboardPreferences,
  reminderPreview,
  copyableReminder,
  dashboardPreferencesSchema,
} from './dashboard-settings';
import { dashboardCsv } from './dashboard-export';
describe('copyable reminder messages and export', () => {
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
  it('copies a complete reminder with a real link, even when the edited template omits it', () => {
    const fields = {
      name: 'Karl Rebane',
      amount: '€60',
      occasion: 'Rome',
      deadline: null,
      url: 'http://localhost:3000/chip-in/pay/demo',
    };
    expect(copyableReminder('Hi [name], [amount] for [occasion].', fields)).toBe(
      `Hi Karl, €60 for Rome.\n${fields.url}`,
    );
    expect(copyableReminder('[link]', fields)).toBe(fields.url);
    expect(copyableReminder('Hi [name]. [link]', { ...fields, name: 'everyone' })).toBe(
      `Hi everyone. ${fields.url}`,
    );
    expect(
      dashboardPreferencesSchema.parse({
        ...defaultDashboardPreferences(),
        contacts: { karl: '+372 5550000' },
        remindersEnabled: true,
      }),
    ).not.toHaveProperty('contacts');
    const legacy = dashboardPreferencesSchema.parse({
      ...defaultDashboardPreferences(),
      remindersEnabled: true,
      rules: defaultDashboardPreferences().rules.map((rule) => ({ ...rule, enabled: true })),
    });
    expect(legacy).not.toHaveProperty('remindersEnabled');
    expect(legacy.rules[0]).not.toHaveProperty('enabled');
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
