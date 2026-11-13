export interface CollectionListItem {
  id: string;
  title: string;
  targetAmountMinorUnits: number;
  currency: string;
  createdAt: Date;
}

export interface ListCollectionsOutputPort {
  present(collections: CollectionListItem[]): void;
}
