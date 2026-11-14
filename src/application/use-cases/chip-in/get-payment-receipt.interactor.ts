import { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import type {
  GetPaymentReceiptInputPort,
  GetPaymentReceiptRequest,
} from '@/application/ports/input/get-payment-receipt.input-port';
import type { GetPaymentReceiptOutputPort } from '@/application/ports/output/get-payment-receipt.output-port';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';
import { toPaymentReceiptResponse } from './chip-in.mapper';

export class GetPaymentReceiptInteractor implements GetPaymentReceiptInputPort {
  constructor(
    private readonly repository: ChipInRepository,
    private readonly outputPort: GetPaymentReceiptOutputPort,
  ) {}

  async execute(request: GetPaymentReceiptRequest): Promise<void> {
    let id: ChipInId;
    try {
      id = ChipInId.create(request.chipInId);
    } catch {
      this.outputPort.present(null);
      return;
    }
    const receipt = await this.repository.findReceiptById(id, request.receiptId);
    this.outputPort.present(receipt ? toPaymentReceiptResponse(receipt) : null);
  }
}
