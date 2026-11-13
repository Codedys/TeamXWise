import type {
  CollectionListItem,
  ListCollectionsOutputPort,
} from '@/application/ports/output/list-collections.output-port';

export interface CollectionListItemViewModel {
  id: string;
  title: string;
  formattedAmount: string;
  createdAtIso: string;
}

export type ListCollectionsViewModel = CollectionListItemViewModel[];

function formatAmount(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
    minorUnits / 100,
  );
}

export class ListCollectionsPresenter implements ListCollectionsOutputPort {
  viewModel: ListCollectionsViewModel | null = null;

  present(collections: CollectionListItem[]): void {
    this.viewModel = collections.map((collection) => ({
      id: collection.id,
      title: collection.title,
      formattedAmount: formatAmount(collection.targetAmountMinorUnits, collection.currency),
      createdAtIso: collection.createdAt.toISOString(),
    }));
  }
}
