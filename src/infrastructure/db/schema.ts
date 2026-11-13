import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const collectionsTable = pgTable('collections', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  targetAmountMinorUnits: integer('target_amount_minor_units').notNull(),
  currency: text('currency').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
