import 'server-only';
import { z } from 'zod';

import type { SubmitPaymentInputPort } from '@/application/ports/input/submit-payment.input-port';
import type { SubmitPaymentViewModel } from '@/adapters/presenters/submit-payment.presenter';

const rawInputSchema = z.object({
  chipInId: z.string().min(1).max(120),
  requestId: z.string().min(1).max(120),
  participantId: z.string().nullable(),
  payerName: z.string().trim().max(100),
  quantity: z.coerce.number().int().positive().max(1_000_000),
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3-letter code')
    .transform((value) => value.toUpperCase()),
  method: z.enum(['instant', 'bank']),
  email: z.string().max(254).default(''),
  answer: z.string().max(1000).default(''),
  expectedSourceMinorUnits: z.number().int().positive().optional(),
});

export class SubmitPaymentController {
  constructor(
    private readonly inputPort: SubmitPaymentInputPort,
    private readonly presenter: { viewModel: SubmitPaymentViewModel | null },
  ) {}

  async handle(rawInput: unknown): Promise<SubmitPaymentViewModel> {
    const parsed = rawInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        status: 'error',
        message: parsed.error.issues[0]?.message ?? 'Invalid demo payment request.',
      };
    }

    await this.inputPort.execute({
      chipInId: parsed.data.chipInId,
      receiptId: crypto.randomUUID(),
      requestId: parsed.data.requestId,
      participantId: parsed.data.participantId,
      payerName: parsed.data.payerName,
      quantity: parsed.data.quantity,
      currency: parsed.data.currency,
      method: parsed.data.method,
      email: parsed.data.email,
      answer: parsed.data.answer,
      expectedSourceMinorUnits: parsed.data.expectedSourceMinorUnits,
      today: new Date().toISOString().slice(0, 10),
    });

    return this.presenter.viewModel as SubmitPaymentViewModel;
  }
}
