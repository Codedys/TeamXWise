import type { ChipIn } from '@/domain/entities/chip-in.entity';
import type { PaymentReceipt } from '@/domain/entities/payment-receipt.entity';
import type { ChipInResponse } from '@/application/ports/output/chip-in.dto';
import type { PaymentReceiptResponse } from '@/application/ports/output/payment-receipt.dto';

/** Maps the aggregate to its plain response DTO — shared by every chip-in use case. */
export function toChipInResponse(chipIn: ChipIn): ChipInResponse {
  return {
    id: chipIn.id.toString(),
    title: chipIn.title,
    description: chipIn.description,
    ownerName: chipIn.ownerName,
    isOpen: chipIn.isOpen,
    invitationMessage: chipIn.invitationMessage,
    audience: chipIn.audience,
    priceMinorUnits: chipIn.price.minorUnits,
    currency: chipIn.price.currency,
    deadline: chipIn.deadline,
    limitType: chipIn.limitType,
    spotLimit: chipIn.spotLimit,
    goalMinorUnits: chipIn.goal.minorUnits,
    collectEmail: chipIn.collectEmail,
    customQuestion: chipIn.customQuestion,
    participants: chipIn.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      status: participant.status,
    })),
    progress: chipIn.progress,
  };
}

export function toPaymentReceiptResponse(receipt: PaymentReceipt): PaymentReceiptResponse {
  return {
    id: receipt.id,
    requestId: receipt.requestId,
    participantId: receipt.participantId,
    payerName: receipt.payerName,
    quantity: receipt.quantity,
    sourceMinorUnits: receipt.sourceAmount.minorUnits,
    sourceCurrency: receipt.sourceAmount.currency,
    payMinorUnits: receipt.payAmount.minorUnits,
    payCurrency: receipt.payAmount.currency,
    rate: receipt.rate,
    method: receipt.method,
    status: receipt.status,
  };
}
