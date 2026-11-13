import 'server-only';
import { z } from 'zod';

import type { CreateCollectionInputPort } from '@/application/ports/input/create-collection.input-port';
import type { CreateCollectionViewModel } from '@/adapters/presenters/create-collection.presenter';

const rawInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  targetAmount: z.coerce.number().positive('Target amount must be greater than zero'),
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3-letter code')
    .transform((value) => value.toUpperCase()),
});

export class CreateCollectionController {
  constructor(
    private readonly inputPort: CreateCollectionInputPort,
    private readonly presenter: { viewModel: CreateCollectionViewModel | null },
  ) {}

  async handle(rawInput: unknown): Promise<CreateCollectionViewModel> {
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
      targetAmountMinorUnits: Math.round(parsed.data.targetAmount * 100),
      currency: parsed.data.currency,
      createdAt: new Date(),
    });

    return this.presenter.viewModel as CreateCollectionViewModel;
  }
}
