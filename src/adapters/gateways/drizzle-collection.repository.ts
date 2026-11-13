import { desc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { Collection } from '@/domain/entities/collection.entity';
import { CollectionId } from '@/domain/value-objects/collection-id.vo';
import { Money } from '@/domain/value-objects/money.vo';
import type { CollectionRepository } from '@/application/ports/repositories/collection.repository';
import * as schema from '@/infrastructure/db/schema';

const { collectionsTable } = schema;

/**
 * The one legitimate place an adapter reaches past "application + domain":
 * a Gateway must speak the query-builder dialect of the driver it wraps
 * (here, drizzle-orm) and know the table shape (infrastructure/db/schema —
 * the one infrastructure import the Dependency Rule allows a gateway).
 * It never imports a *live* client, though: that instance is always
 * constructor-injected from the composition root.
 */
export class DrizzleCollectionRepository implements CollectionRepository {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async save(collection: Collection): Promise<void> {
    await this.db.insert(collectionsTable).values({
      id: collection.id.toString(),
      title: collection.title,
      targetAmountMinorUnits: collection.targetAmount.minorUnits,
      currency: collection.targetAmount.currency,
      createdAt: collection.createdAt,
    });
  }

  async findAll(): Promise<Collection[]> {
    const rows = await this.db
      .select()
      .from(collectionsTable)
      .orderBy(desc(collectionsTable.createdAt));

    return rows.map((row) =>
      Collection.create({
        id: CollectionId.create(row.id),
        title: row.title,
        targetAmount: Money.create(row.targetAmountMinorUnits, row.currency),
        createdAt: row.createdAt,
      }),
    );
  }
}
