import 'server-only';
import { z } from 'zod';

import type { GetChipInDashboardInputPort } from '@/application/ports/input/get-chip-in-dashboard.input-port';
import type { GetChipInDashboardViewModel } from '@/adapters/presenters/get-chip-in-dashboard.presenter';

const rawInputSchema = z.object({
  id: z.string().min(1).max(120),
  ownerToken: z.string().min(1),
});

export class GetChipInDashboardController {
  constructor(
    private readonly inputPort: GetChipInDashboardInputPort,
    private readonly presenter: { viewModel: GetChipInDashboardViewModel },
  ) {}

  async handle(rawInput: unknown): Promise<GetChipInDashboardViewModel> {
    const parsed = rawInputSchema.safeParse(rawInput);
    if (!parsed.success) return null;

    await this.inputPort.execute(parsed.data);

    return this.presenter.viewModel;
  }
}
