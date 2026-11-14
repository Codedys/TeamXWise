import type { ChipIn } from '@/domain/entities/chip-in.entity';
import type { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import type { PaymentReceipt } from '@/domain/entities/payment-receipt.entity';
import type { DashboardPreferencesDto } from '@/application/ports/output/chip-in-dashboard.dto';

export interface ChipInDashboardRecord {
  chipIn: ChipIn;
  preferences: DashboardPreferencesDto;
  isActivated: boolean;
  /** The owner sees every payer's own receipt — names, answers, quantities. */
  receipts: PaymentReceipt[];
}

/** Gateway interface — implemented by adapters/gateways, never imported from there. */
export interface ChipInRepository {
  /**
   * `ownerToken` and `preferences` are access-control / owner-UI metadata, not domain
   * concepts — stored alongside the aggregate, never on the entity itself.
   */
  save(chipIn: ChipIn, ownerToken: string, preferences: DashboardPreferencesDto): Promise<void>;
  findById(id: ChipInId): Promise<ChipIn | null>;
  findReceiptById(chipInId: ChipInId, receiptId: string): Promise<PaymentReceipt | null>;
  /** Scoped by `ownerToken` at the query itself — a non-owner gets `null`, never a distinguishable error. */
  findDashboardById(id: ChipInId, ownerToken: string): Promise<ChipInDashboardRecord | null>;
  /** Only chip-ins the owner has activated (clicked "Done" on) are ever listed. */
  findManyActivatedByOwnerToken(ownerToken: string): Promise<ChipInDashboardRecord[]>;
  /** Each owner-mutation is scoped by `ownerToken`; throws ChipInNotFoundError if it doesn't match. */
  savePreferences(id: ChipInId, ownerToken: string, preferences: DashboardPreferencesDto): Promise<void>;
  activate(id: ChipInId, ownerToken: string): Promise<void>;
  /** Persists the mutable top-level settings a configure-link edit can change. */
  updateSettings(chipIn: ChipIn, ownerToken: string): Promise<void>;
  remove(id: ChipInId, ownerToken: string): Promise<void>;
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
