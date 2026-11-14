import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { ChipIn } from '@/domain/entities/chip-in.entity';
import { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import { Money } from '@/domain/value-objects/money.vo';
import { Participant } from '@/domain/entities/participant.entity';
import { PaymentReceipt } from '@/domain/entities/payment-receipt.entity';
import { ChipInNotFoundError } from '@/domain/errors/chip-in-not-found.error';
import { PaymentReceiptNotFoundError } from '@/domain/errors/payment-receipt-not-found.error';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';
import * as schema from '@/infrastructure/db/schema';

const { chipInsTable, chipInParticipantsTable, chipInPaymentsTable } = schema;

type ChipInRow = typeof chipInsTable.$inferSelect;
type ParticipantRow = typeof chipInParticipantsTable.$inferSelect;
type PaymentRow = typeof chipInPaymentsTable.$inferSelect;
type ChipInTransaction = Parameters<
  Parameters<PostgresJsDatabase<typeof schema>['transaction']>[0]
>[0];

function toDomainChipIn(row: ChipInRow, participantRows: ParticipantRow[]): ChipIn {
  return ChipIn.create({
    id: ChipInId.create(row.id),
    title: row.title,
    description: row.description,
    ownerName: row.ownerName,
    isOpen: row.isOpen,
    invitationMessage: row.invitationMessage,
    audience: row.audience as 'group' | 'anyone',
    price: Money.create(row.priceMinorUnits, row.currency),
    deadline: row.deadline,
    limitType: row.limitType as 'none' | 'spots' | 'goal',
    spotLimit: row.spotLimit,
    goal: Money.create(row.goalMinorUnits, row.currency),
    collectEmail: row.collectEmail,
    customQuestion: row.customQuestion,
    participants: participantRows.map((participant) =>
      Participant.create({
        id: participant.id,
        name: participant.name,
        status: participant.status as 'unpaid' | 'pending' | 'paid',
      }),
    ),
    progress: { paidSpots: row.paidSpots, receivedMinorUnits: row.receivedMinorUnits },
    createdAt: row.createdAt,
  });
}

function toDomainReceipt(row: PaymentRow): PaymentReceipt {
  return PaymentReceipt.create({
    id: row.id,
    requestId: row.requestId,
    participantId: row.participantId,
    payerName: row.payerName,
    quantity: row.quantity,
    sourceAmount: Money.create(row.sourceMinorUnits, row.sourceCurrency),
    payAmount: Money.create(row.payMinorUnits, row.payCurrency),
    rate: row.rate,
    method: row.method as 'instant' | 'bank',
    status: row.status as 'pending' | 'paid',
  });
}

function toPaymentRow(receipt: PaymentReceipt, chipInId: string) {
  return {
    id: receipt.id,
    chipInId,
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

/**
 * The one legitimate place an adapter reaches past "application + domain" — see
 * DrizzleCollectionRepository for the full rationale. `submitPayment` and
 * `confirmPendingPayment` are the correctness-critical methods: both open a
 * transaction, take a `FOR UPDATE` row lock on the chip-in before reading it, call the
 * supplied pure domain callback, then persist — safe under concurrent contributions from
 * many devices at once. The `chip_in_payments` unique index on (chip_in_id, request_id)
 * is the idempotency guarantee for a retried/double-tapped submission.
 */
export class DrizzleChipInRepository implements ChipInRepository {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async save(chipIn: ChipIn, ownerToken: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(chipInsTable).values({
        id: chipIn.id.toString(),
        ownerToken,
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
        paidSpots: chipIn.progress.paidSpots,
        receivedMinorUnits: chipIn.progress.receivedMinorUnits,
        createdAt: chipIn.createdAt,
      });
      const participants = chipIn.participants;
      if (participants.length) {
        await tx.insert(chipInParticipantsTable).values(
          participants.map((participant) => ({
            id: participant.id,
            chipInId: chipIn.id.toString(),
            name: participant.name,
            status: participant.status,
          })),
        );
      }
    });
  }

  async findById(id: ChipInId): Promise<ChipIn | null> {
    const [row] = await this.db
      .select()
      .from(chipInsTable)
      .where(eq(chipInsTable.id, id.toString()));
    if (!row) return null;
    const participantRows = await this.db
      .select()
      .from(chipInParticipantsTable)
      .where(eq(chipInParticipantsTable.chipInId, id.toString()));
    return toDomainChipIn(row, participantRows);
  }

  async findReceiptById(chipInId: ChipInId, receiptId: string): Promise<PaymentReceipt | null> {
    const [row] = await this.db
      .select()
      .from(chipInPaymentsTable)
      .where(
        and(
          eq(chipInPaymentsTable.chipInId, chipInId.toString()),
          eq(chipInPaymentsTable.id, receiptId),
        ),
      );
    return row ? toDomainReceipt(row) : null;
  }

  async submitPayment(
    id: ChipInId,
    requestId: string,
    build: (chipIn: ChipIn) => { chipIn: ChipIn; receipt: PaymentReceipt },
  ): Promise<PaymentReceipt> {
    return this.db.transaction(async (tx) => {
      // Lock first, then check for a duplicate request — a concurrent transaction's insert
      // is only guaranteed visible once we hold this row's lock, not before.
      const [row] = await tx
        .select()
        .from(chipInsTable)
        .where(eq(chipInsTable.id, id.toString()))
        .for('update');
      if (!row) throw new ChipInNotFoundError();

      const [existing] = await tx
        .select()
        .from(chipInPaymentsTable)
        .where(
          and(
            eq(chipInPaymentsTable.chipInId, id.toString()),
            eq(chipInPaymentsTable.requestId, requestId),
          ),
        );
      if (existing) return toDomainReceipt(existing);

      const participantRows = await tx
        .select()
        .from(chipInParticipantsTable)
        .where(eq(chipInParticipantsTable.chipInId, id.toString()));
      const before = toDomainChipIn(row, participantRows);

      const { chipIn: after, receipt } = build(before);

      await this.persistChanges(tx, id, before, after);
      await tx.insert(chipInPaymentsTable).values(toPaymentRow(receipt, id.toString()));
      return receipt;
    });
  }

  async confirmPendingPayment(
    id: ChipInId,
    receiptId: string,
    build: (chipIn: ChipIn, receipt: PaymentReceipt) => { chipIn: ChipIn; receipt: PaymentReceipt },
  ): Promise<PaymentReceipt> {
    return this.db.transaction(async (tx) => {
      const [existingReceipt] = await tx
        .select()
        .from(chipInPaymentsTable)
        .where(
          and(
            eq(chipInPaymentsTable.chipInId, id.toString()),
            eq(chipInPaymentsTable.id, receiptId),
          ),
        );
      if (!existingReceipt) throw new PaymentReceiptNotFoundError();
      if (existingReceipt.status === 'paid') return toDomainReceipt(existingReceipt);

      const [row] = await tx
        .select()
        .from(chipInsTable)
        .where(eq(chipInsTable.id, id.toString()))
        .for('update');
      if (!row) throw new ChipInNotFoundError();
      const participantRows = await tx
        .select()
        .from(chipInParticipantsTable)
        .where(eq(chipInParticipantsTable.chipInId, id.toString()));
      const before = toDomainChipIn(row, participantRows);
      const pendingReceipt = toDomainReceipt(existingReceipt);

      const { chipIn: after, receipt } = build(before, pendingReceipt);

      await this.persistChanges(tx, id, before, after);
      await tx
        .update(chipInPaymentsTable)
        .set({ status: receipt.status })
        .where(eq(chipInPaymentsTable.id, receipt.id));
      return receipt;
    });
  }

  private async persistChanges(
    tx: ChipInTransaction,
    id: ChipInId,
    before: ChipIn,
    after: ChipIn,
  ): Promise<void> {
    await tx
      .update(chipInsTable)
      .set({
        paidSpots: after.progress.paidSpots,
        receivedMinorUnits: after.progress.receivedMinorUnits,
      })
      .where(eq(chipInsTable.id, id.toString()));

    const beforeParticipants = before.participants;
    for (const participant of after.participants) {
      const previous = beforeParticipants.find((person) => person.id === participant.id);
      if (previous && previous.status !== participant.status) {
        await tx
          .update(chipInParticipantsTable)
          .set({ status: participant.status })
          .where(eq(chipInParticipantsTable.id, participant.id));
      }
    }
  }
}
