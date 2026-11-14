import 'server-only';
import { z } from 'zod';

import type { RemoveChipInInputPort } from '@/application/ports/input/remove-chip-in.input-port';
import type { RemoveChipInViewModel } from '@/adapters/presenters/remove-chip-in.presenter';

const rawInputSchema = z.object({
  id: z.string().min(1).max(120),
  ownerToken: z.string().min(1),
});

export class RemoveChipInController {
  constructor(
    private readonly inputPort: RemoveChipInInputPort,
    private readonly presenter: { viewModel: RemoveChipInViewModel | null },
  ) {}

  async handle(rawInput: unknown): Promise<RemoveChipInViewModel> {
    const parsed = rawInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { status: 'error', message: 'Invalid request.' };
    }

    await this.inputPort.execute(parsed.data);

    return this.presenter.viewModel as RemoveChipInViewModel;
  }
}
