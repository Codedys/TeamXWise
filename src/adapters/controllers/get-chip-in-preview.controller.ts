import 'server-only';
import { z } from 'zod';

import type { GetChipInPreviewInputPort } from '@/application/ports/input/get-chip-in-preview.input-port';
import type { GetChipInPreviewViewModel } from '@/adapters/presenters/get-chip-in-preview.presenter';

const rawInputSchema = z.object({
  id: z.string().min(1).max(120),
});

export class GetChipInPreviewController {
  constructor(
    private readonly inputPort: GetChipInPreviewInputPort,
    private readonly presenter: { viewModel: GetChipInPreviewViewModel },
  ) {}

  async handle(rawInput: unknown): Promise<GetChipInPreviewViewModel> {
    const parsed = rawInputSchema.safeParse(rawInput);
    if (!parsed.success) return null;

    await this.inputPort.execute({ id: parsed.data.id });

    return this.presenter.viewModel;
  }
}
