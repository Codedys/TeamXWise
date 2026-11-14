import type { ChipIn } from '@/domain/entities/chip-in.entity';
import type { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import type { PaymentReceipt } from '@/domain/entities/payment-receipt.entity';

/** Gateway interface — implemented by adapters/gateways, never imported from there. */
export interface ChipInRepository {
  /** `ownerToken` is access-control metadata, not a domain concept — stored alongside, never on the entity. */
  save(chipIn: ChipIn, ownerToken: string): Promise<void>;
  findById(id: ChipInId): Promise<ChipIn | null>;
  findReceiptById(chipInId: ChipInId, receiptId: string): Promise<PaymentReceipt | null>;
  /**
   * Atomically applies a brand-new contribution: locks the row, reconstructs the aggregate,
   * calls `build` with it, persists the result, and inserts the receipt. If `requestId` has
   * already been recorded for this chip-in, returns the existing receipt without calling
   * `build` again — the idempotency guarantee lives here, not in application logic.
   */
  submitPayment(
    id: ChipInId,
    requestId: string,
    build: (chipIn: ChipIn) => { chipIn: ChipIn; receipt: PaymentReceipt },
  ): Promise<PaymentReceipt>;
  /** Same locking contract as `submitPayment`, for confirming an existing pending receipt. */
  confirmPendingPayment(
    id: ChipInId,
    receiptId: string,
    build: (chipIn: ChipIn, receipt: PaymentReceipt) => { chipIn: ChipIn; receipt: PaymentReceipt },
  ): Promise<PaymentReceipt>;
}
