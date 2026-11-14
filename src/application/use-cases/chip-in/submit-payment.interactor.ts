import { DomainError } from '@/domain/errors/domain-error';
import { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import type {
  SubmitPaymentInputPort,
  SubmitPaymentRequest,
} from '@/application/ports/input/submit-payment.input-port';
import type { SubmitPaymentOutputPort } from '@/application/ports/output/submit-payment.output-port';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';
import { toPaymentReceiptResponse } from './chip-in.mapper';

export class SubmitPaymentInteractor implements SubmitPaymentInputPort {
  constructor(
    private readonly repository: ChipInRepository,
    private readonly outputPort: SubmitPaymentOutputPort,
  ) {}

  async execute(request: SubmitPaymentRequest): Promise<void> {
    try {
      const id = ChipInId.create(request.chipInId);
      const receipt = await this.repository.submitPayment(id, request.requestId, (chipIn) =>
        chipIn.acceptNewPayment({
          receiptId: request.receiptId,
          requestId: request.requestId,
          participantId: request.participantId,
          payerName: request.payerName,
          quantity: request.quantity,
          currency: request.currency,
          method: request.method,
          email: request.email,
          answer: request.answer,
          expectedSourceMinorUnits: request.expectedSourceMinorUnits,
          today: request.today,
          now: request.now,
        }),
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
