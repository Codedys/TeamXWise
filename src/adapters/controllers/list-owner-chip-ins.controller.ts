import 'server-only';
import { z } from 'zod';

import type { ListOwnerChipInsInputPort } from '@/application/ports/input/list-owner-chip-ins.input-port';
import type { ListOwnerChipInsViewModel } from '@/adapters/presenters/list-owner-chip-ins.presenter';

const rawInputSchema = z.object({
  ownerToken: z.string().min(1),
});

export class ListOwnerChipInsController {
  constructor(
    private readonly inputPort: ListOwnerChipInsInputPort,
    private readonly presenter: { viewModel: ListOwnerChipInsViewModel },
  ) {}

  async handle(rawInput: unknown): Promise<ListOwnerChipInsViewModel> {
    const parsed = rawInputSchema.safeParse(rawInput);
    if (!parsed.success) return [];

    await this.inputPort.execute(parsed.data);

    return this.presenter.viewModel;
  }
}
