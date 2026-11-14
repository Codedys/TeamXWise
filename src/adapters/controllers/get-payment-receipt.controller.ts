import 'server-only';
import { z } from 'zod';

import type { GetPaymentReceiptInputPort } from '@/application/ports/input/get-payment-receipt.input-port';
import type { GetPaymentReceiptViewModel } from '@/adapters/presenters/get-payment-receipt.presenter';

const rawInputSchema = z.object({
  chipInId: z.string().min(1).max(120),
  receiptId: z.string().min(1).max(120),
});

export class GetPaymentReceiptController {
  constructor(
    private readonly inputPort: GetPaymentReceiptInputPort,
    private readonly presenter: { viewModel: GetPaymentReceiptViewModel },
  ) {}

  async handle(rawInput: unknown): Promise<GetPaymentReceiptViewModel> {
    const parsed = rawInputSchema.safeParse(rawInput);
    if (!parsed.success) return null;

    await this.inputPort.execute(parsed.data);

    return this.presenter.viewModel;
  }
}
