import type { ListCollectionsViewModel } from '@/adapters/presenters/list-collections.presenter';

export function CollectionList({ collections }: { collections: ListCollectionsViewModel }) {
  if (collections.length === 0) {
    return <p>No collections yet. Create the first one above.</p>;
  }

  return (
    <ul className="collection-list">
      {collections.map((collection) => (
        <li key={collection.id}>
          <span className="collection-list__title">{collection.title}</span>
          <span className="collection-list__amount">{collection.formattedAmount}</span>
        </li>
      ))}
    </ul>
  );
}
