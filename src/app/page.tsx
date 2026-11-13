import { listCollectionsAction } from '@/app/actions';
import { CollectionForm } from '@/app/components/collection-form';
import { CollectionList } from '@/app/components/collection-list';

export default async function HomePage() {
  const collections = await listCollectionsAction();

  return (
    <main className="page">
      <h1>Collect</h1>
      <p>Start a group payment pot and share one link. No app, no account for payers.</p>

      <section>
        <h2>New collection</h2>
        <CollectionForm />
      </section>

      <section>
        <h2>Your collections</h2>
        <CollectionList collections={collections} />
      </section>
    </main>
  );
}
