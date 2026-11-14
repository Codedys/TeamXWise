import type { CollectionPreviewClient } from '../collection-preview/collection-preview-client';
import type { CollectionDashboardClient } from './collection-dashboard-client';

/** Frontend orchestration; a backend will delete the owner's collection atomically. */
export async function deleteCollectionPreview(
  id: string,
  payments: CollectionPreviewClient,
  dashboards: CollectionDashboardClient,
): Promise<void> {
  // A failed token deletion keeps the dashboard available for retry.
  await payments.remove(id);
  dashboards.remove(id);
}
