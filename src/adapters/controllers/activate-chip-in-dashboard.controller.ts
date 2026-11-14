import 'server-only';
import { z } from 'zod';

import type { ActivateChipInDashboardInputPort } from '@/application/ports/input/activate-chip-in-dashboard.input-port';
import type { ActivateChipInDashboardViewModel } from '@/adapters/presenters/activate-chip-in-dashboard.presenter';

const rawInputSchema = z.object({
  id: z.string().min(1).max(120),
  ownerToken: z.string().min(1),
});

export class ActivateChipInDashboardController {
  constructor(
    private readonly inputPort: ActivateChipInDashboardInputPort,
    private readonly presenter: { viewModel: ActivateChipInDashboardViewModel | null },
  ) {}

  async handle(rawInput: unknown): Promise<ActivateChipInDashboardViewModel> {
    const parsed = rawInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { status: 'error', message: 'Invalid request.' };
    }

    await this.inputPort.execute(parsed.data);

    return this.presenter.viewModel as ActivateChipInDashboardViewModel;
  }
}
