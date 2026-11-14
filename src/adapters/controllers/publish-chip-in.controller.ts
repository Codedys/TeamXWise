import 'server-only';
import { z } from 'zod';

import type { PublishChipInInputPort } from '@/application/ports/input/publish-chip-in.input-port';
import type { PublishChipInViewModel } from '@/adapters/presenters/publish-chip-in.presenter';

const rawInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  description: z.string().max(1000).default(''),
  ownerToken: z.string().min(1),
  audience: z.enum(['group', 'anyone']),
  amount: z.coerce.number().positive('Enter an amount greater than zero'),
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3-letter code')
    .transform((value) => value.toUpperCase()),
  deadline: z.string().nullable(),
  limitType: z.enum(['none', 'spots', 'goal']),
  spotLimit: z.coerce.number().int().positive().max(1_000_000),
  goalAmount: z.coerce.number().positive(),
  collectEmail: z.boolean().default(false),
  customQuestion: z.string().trim().max(200).nullable(),
  invitationMessage: z.string().max(2000).nullable(),
  names: z.array(z.string().trim().min(1).max(100)).max(500).default([]),
});

export class PublishChipInController {
  constructor(
    private readonly inputPort: PublishChipInInputPort,
    private readonly presenter: { viewModel: PublishChipInViewModel | null },
  ) {}

  async handle(rawInput: unknown): Promise<PublishChipInViewModel> {
    const parsed = rawInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        status: 'error',
        message: parsed.error.issues[0]?.message ?? 'Invalid input',
      };
    }

    await this.inputPort.execute({
      id: crypto.randomUUID(),
      title: parsed.data.title,
      description: parsed.data.description,
      ownerName: 'John Doe',
      ownerToken: parsed.data.ownerToken,
      audience: parsed.data.audience,
      priceMinorUnits: Math.round(parsed.data.amount * 100),
      currency: parsed.data.currency,
      deadline: parsed.data.deadline,
      limitType: parsed.data.limitType,
      spotLimit: parsed.data.spotLimit,
      goalMinorUnits: Math.round(parsed.data.goalAmount * 100),
      collectEmail: parsed.data.collectEmail,
      customQuestion: parsed.data.customQuestion,
      invitationMessage: parsed.data.invitationMessage,
      names: parsed.data.names,
      createdAt: new Date(),
    });

    return this.presenter.viewModel as PublishChipInViewModel;
  }
}
