import 'server-only';
import { z } from 'zod';

import type { ConfirmBankTransferInputPort } from '@/application/ports/input/confirm-bank-transfer.input-port';
import type { ConfirmBankTransferViewModel } from '@/adapters/presenters/confirm-bank-transfer.presenter';

const rawInputSchema = z.object({
  chipInId: z.string().min(1).max(120),
  receiptId: z.string().min(1).max(120),
});

export class ConfirmBankTransferController {
  constructor(
    private readonly inputPort: ConfirmBankTransferInputPort,
    private readonly presenter: { viewModel: ConfirmBankTransferViewModel | null },
  ) {}

  async handle(rawInput: unknown): Promise<ConfirmBankTransferViewModel> {
    const parsed = rawInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        status: 'error',
        message: parsed.error.issues[0]?.message ?? 'Invalid request.',
      };
    }

    await this.inputPort.execute({
      chipInId: parsed.data.chipInId,
      receiptId: parsed.data.receiptId,
      today: new Date().toISOString().slice(0, 10),
      now: new Date(),
    });

    return this.presenter.viewModel as ConfirmBankTransferViewModel;
  }
}
