import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const collectionsTable = pgTable('collections', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  targetAmountMinorUnits: integer('target_amount_minor_units').notNull(),
  currency: text('currency').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const chipInsTable = pgTable('chip_ins', {
  id: text('id').primaryKey(),
  ownerToken: text('owner_token').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  ownerName: text('owner_name').notNull(),
  isOpen: boolean('is_open').notNull(),
  invitationMessage: text('invitation_message'),
  audience: text('audience').notNull(),
  priceMinorUnits: integer('price_minor_units').notNull(),
  currency: text('currency').notNull(),
  deadline: text('deadline'),
  limitType: text('limit_type').notNull(),
  spotLimit: integer('spot_limit').notNull(),
  goalMinorUnits: integer('goal_minor_units').notNull(),
  collectEmail: boolean('collect_email').notNull(),
  customQuestion: text('custom_question'),
  paidSpots: integer('paid_spots').notNull().default(0),
  receivedMinorUnits: integer('received_minor_units').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const chipInParticipantsTable = pgTable('chip_in_participants', {
  id: text('id').primaryKey(),
  chipInId: text('chip_in_id')
    .notNull()
    .references(() => chipInsTable.id),
  name: text('name').notNull(),
  status: text('status').notNull(),
});

export const chipInPaymentsTable = pgTable(
  'chip_in_payments',
  {
    id: text('id').primaryKey(),
    chipInId: text('chip_in_id')
      .notNull()
      .references(() => chipInsTable.id),
    requestId: text('request_id').notNull(),
    participantId: text('participant_id'),
    payerName: text('payer_name').notNull(),
    quantity: integer('quantity').notNull(),
    sourceMinorUnits: integer('source_minor_units').notNull(),
    sourceCurrency: text('source_currency').notNull(),
    payMinorUnits: integer('pay_minor_units').notNull(),
    payCurrency: text('pay_currency').notNull(),
    rate: doublePrecision('rate').notNull(),
    method: text('method').notNull(),
    status: text('status').notNull(),
  },
  (table) => [
    // Idempotency: a retried/double-tapped submission must never be counted twice.
    uniqueIndex('chip_in_payments_chip_in_request_idx').on(table.chipInId, table.requestId),
  ],
);
