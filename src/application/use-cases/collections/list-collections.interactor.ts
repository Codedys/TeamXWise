import type { ListCollectionsInputPort } from '@/application/ports/input/list-collections.input-port';
import type { ListCollectionsOutputPort } from '@/application/ports/output/list-collections.output-port';
import type { CollectionRepository } from '@/application/ports/repositories/collection.repository';

export class ListCollectionsInteractor implements ListCollectionsInputPort {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly outputPort: ListCollectionsOutputPort,
  ) {}

  async execute(): Promise<void> {
    const collections = await this.repository.findAll();

    this.outputPort.present(
      collections.map((collection) => ({
        id: collection.id.toString(),
        title: collection.title,
        targetAmountMinorUnits: collection.targetAmount.minorUnits,
        currency: collection.targetAmount.currency,
        createdAt: collection.createdAt,
      })),
    );
  }
}
