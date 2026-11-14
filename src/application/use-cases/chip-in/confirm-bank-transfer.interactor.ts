import { DomainError } from '@/domain/errors/domain-error';
import { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import type {
  ConfirmBankTransferInputPort,
  ConfirmBankTransferRequest,
} from '@/application/ports/input/confirm-bank-transfer.input-port';
import type { ConfirmBankTransferOutputPort } from '@/application/ports/output/confirm-bank-transfer.output-port';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';
import { toPaymentReceiptResponse } from './chip-in.mapper';

export class ConfirmBankTransferInteractor implements ConfirmBankTransferInputPort {
  constructor(
    private readonly repository: ChipInRepository,
    private readonly outputPort: ConfirmBankTransferOutputPort,
  ) {}

  async execute(request: ConfirmBankTransferRequest): Promise<void> {
    try {
      const id = ChipInId.create(request.chipInId);
      const receipt = await this.repository.confirmPendingPayment(
        id,
        request.receiptId,
        (chipIn, pendingReceipt) =>
          chipIn.confirmPendingPayment(pendingReceipt, request.today, request.now),
      );
      this.outputPort.presentSuccess(toPaymentReceiptResponse(receipt));
    } catch (error) {
      if (error instanceof DomainError) {
        this.outputPort.presentError(error);
        return;
      }
      throw error;
    }
  }
}
