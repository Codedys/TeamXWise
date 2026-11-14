import 'server-only';
import { z } from 'zod';

import type { SaveDashboardPreferencesInputPort } from '@/application/ports/input/save-dashboard-preferences.input-port';
import type { SaveDashboardPreferencesViewModel } from '@/adapters/presenters/save-dashboard-preferences.presenter';

const reminderRuleSchema = z.object({
  id: z.enum(['week', 'day', 'due']),
  message: z.string().trim().min(1).max(1000),
});

const rawInputSchema = z.object({
  id: z.string().min(1).max(120),
  ownerToken: z.string().min(1),
  preferences: z.object({
    rules: z.array(reminderRuleSchema).length(3),
    cohosts: z.array(z.string().trim().min(1).max(100)).max(10),
    completionDismissed: z.boolean(),
  }),
});

export class SaveDashboardPreferencesController {
  constructor(
    private readonly inputPort: SaveDashboardPreferencesInputPort,
    private readonly presenter: { viewModel: SaveDashboardPreferencesViewModel | null },
  ) {}

  async handle(rawInput: unknown): Promise<SaveDashboardPreferencesViewModel> {
    const parsed = rawInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        status: 'error',
        message: parsed.error.issues[0]?.message ?? 'Invalid input',
      };
    }

    await this.inputPort.execute(parsed.data);

    return this.presenter.viewModel as SaveDashboardPreferencesViewModel;
  }
}
