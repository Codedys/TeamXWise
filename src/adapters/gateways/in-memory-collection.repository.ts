import type { Collection } from '@/domain/entities/collection.entity';
import type { CollectionRepository } from '@/application/ports/repositories/collection.repository';

/**
 * Kept as a module-level singleton (not per-request) so that a Collection
 * created in one Server Action call is visible to a List call in the next.
 */
export class InMemoryCollectionRepository implements CollectionRepository {
  private readonly collections: Collection[] = [];

  async save(collection: Collection): Promise<void> {
    this.collections.push(collection);
  }

  async findAll(): Promise<Collection[]> {
    return [...this.collections].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
}
