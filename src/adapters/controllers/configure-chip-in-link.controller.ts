import 'server-only';
import { z } from 'zod';

import type { ConfigureChipInLinkInputPort } from '@/application/ports/input/configure-chip-in-link.input-port';
import type { ConfigureChipInLinkViewModel } from '@/adapters/presenters/configure-chip-in-link.presenter';

const rawInputSchema = z.object({
  id: z.string().min(1).max(120),
  ownerToken: z.string().min(1),
  isOpen: z.boolean(),
  deadline: z.string().nullable(),
  price: z.coerce.number().positive('Use the current price or a higher price for new payers.'),
  limitType: z.enum(['none', 'spots', 'goal']),
  spotLimit: z.coerce.number().int().positive().max(1_000_000),
  goalAmount: z.coerce.number().positive(),
  customQuestion: z.string().trim().max(200).nullable(),
});

export class ConfigureChipInLinkController {
  constructor(
    private readonly inputPort: ConfigureChipInLinkInputPort,
    private readonly presenter: { viewModel: ConfigureChipInLinkViewModel | null },
  ) {}

  async handle(rawInput: unknown): Promise<ConfigureChipInLinkViewModel> {
    const parsed = rawInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        status: 'error',
        message: parsed.error.issues[0]?.message ?? 'Could not save link settings.',
      };
    }

    await this.inputPort.execute({
      id: parsed.data.id,
      ownerToken: parsed.data.ownerToken,
      isOpen: parsed.data.isOpen,
      deadline: parsed.data.deadline,
      priceMinorUnits: Math.round(parsed.data.price * 100),
      limitType: parsed.data.limitType,
      spotLimit: parsed.data.spotLimit,
      goalMinorUnits: Math.round(parsed.data.goalAmount * 100),
      customQuestion: parsed.data.customQuestion,
      today: new Date().toISOString().slice(0, 10),
    });

    return this.presenter.viewModel as ConfigureChipInLinkViewModel;
  }
}
