import type { Collection } from '@/domain/entities/collection.entity';

/** Gateway interface — implemented by adapters/gateways, never imported from there. */
export interface CollectionRepository {
  save(collection: Collection): Promise<void>;
  findAll(): Promise<Collection[]>;
}
