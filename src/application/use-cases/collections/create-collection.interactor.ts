import { Collection } from '@/domain/entities/collection.entity';
import { DomainError } from '@/domain/errors/domain-error';
import { CollectionId } from '@/domain/value-objects/collection-id.vo';
import { Money } from '@/domain/value-objects/money.vo';
import type {
  CreateCollectionInputPort,
  CreateCollectionRequest,
} from '@/application/ports/input/create-collection.input-port';
import type { CreateCollectionOutputPort } from '@/application/ports/output/create-collection.output-port';
import type { CollectionRepository } from '@/application/ports/repositories/collection.repository';

export class CreateCollectionInteractor implements CreateCollectionInputPort {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly outputPort: CreateCollectionOutputPort,
  ) {}

  async execute(request: CreateCollectionRequest): Promise<void> {
    try {
      const collection = Collection.create({
        id: CollectionId.create(request.id),
        title: request.title,
        targetAmount: Money.create(request.targetAmountMinorUnits, request.currency),
        createdAt: request.createdAt,
      });

      await this.repository.save(collection);

      this.outputPort.presentSuccess({
        id: collection.id.toString(),
        title: collection.title,
        targetAmountMinorUnits: collection.targetAmount.minorUnits,
        currency: collection.targetAmount.currency,
        createdAt: collection.createdAt,
      });
    } catch (error) {
      if (error instanceof DomainError) {
        this.outputPort.presentError(error);
        return;
      }
      throw error;
    }
  }
}
