import type { ChipIn } from '@/domain/entities/chip-in.entity';
import type { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import type { PaymentReceipt } from '@/domain/entities/payment-receipt.entity';
import { ChipInNotFoundError } from '@/domain/errors/chip-in-not-found.error';
import { PaymentReceiptNotFoundError } from '@/domain/errors/payment-receipt-not-found.error';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';

interface StoredChipIn {
  chipIn: ChipIn;
  ownerToken: string;
  receipts: PaymentReceipt[];
}

/**
 * Kept as a module-level singleton (not per-request), matching
 * InMemoryCollectionRepository, so writes in one call are visible to the next.
 * The lock a real gateway needs under concurrency is unnecessary here —
 * Node's single-threaded event loop already serializes these calls.
 */
export class InMemoryChipInRepository implements ChipInRepository {
  private readonly store = new Map<string, StoredChipIn>();

  async save(chipIn: ChipIn, ownerToken: string): Promise<void> {
    this.store.set(chipIn.id.toString(), { chipIn, ownerToken, receipts: [] });
  }

  async findById(id: ChipInId): Promise<ChipIn | null> {
    return this.store.get(id.toString())?.chipIn ?? null;
  }

  async findReceiptById(chipInId: ChipInId, receiptId: string): Promise<PaymentReceipt | null> {
    const record = this.store.get(chipInId.toString());
    return record?.receipts.find((receipt) => receipt.id === receiptId) ?? null;
  }

  async submitPayment(
    id: ChipInId,
    requestId: string,
    build: (chipIn: ChipIn) => { chipIn: ChipIn; receipt: PaymentReceipt },
  ): Promise<PaymentReceipt> {
    const record = this.store.get(id.toString());
    if (!record) throw new ChipInNotFoundError();
    const existing = record.receipts.find((receipt) => receipt.requestId === requestId);
    if (existing) return existing;
    const { chipIn, receipt } = build(record.chipIn);
    record.chipIn = chipIn;
    record.receipts.push(receipt);
    return receipt;
  }

  async confirmPendingPayment(
    id: ChipInId,
    receiptId: string,
    build: (chipIn: ChipIn, receipt: PaymentReceipt) => { chipIn: ChipIn; receipt: PaymentReceipt },
  ): Promise<PaymentReceipt> {
    const record = this.store.get(id.toString());
    if (!record) throw new ChipInNotFoundError();
    const existingReceipt = record.receipts.find((receipt) => receipt.id === receiptId);
    if (!existingReceipt) throw new PaymentReceiptNotFoundError();
    if (existingReceipt.status === 'paid') return existingReceipt;
    const { chipIn, receipt } = build(record.chipIn, existingReceipt);
    record.chipIn = chipIn;
    record.receipts = record.receipts.map((stored) =>
      stored.id === receipt.id ? receipt : stored,
    );
    return receipt;
  }
}
