import { describe, expect, it } from 'vitest';
import { emptyCollectionDraft } from '../create-collection/create-collection-draft';
import { createBrowserCollectionPreviewClient } from '../collection-preview/browser-collection-preview-client';
import { createBrowserCollectionDashboardClient } from './browser-collection-dashboard-client';
import { deleteCollectionPreview } from './delete-collection-preview';

describe('durable owner deletion', () => {
  it('does not report success when storage refuses deletion, then recovers on retry', async () => {
    const saved = new Map<string, string>();
    let failKey = '';
    let id = 0;
    const storage = () => ({
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (key === failKey) throw new Error('QuotaExceededError');
        saved.set(key, value);
      },
    });
    const dashboards = createBrowserCollectionDashboardClient({ storage });
    const payments = createBrowserCollectionPreviewClient({
      storage,
      dashboards,
      id: () => `delete-${++id}`,
      today: () => '2026-11-14',
      now: () => 1000,
    });
    const collection = await payments.publish({
      ...emptyCollectionDraft(),
      title: 'Demo',
      audience: 'anyone',
      noDeadline: true,
    });
    dashboards.activate(collection.id);
    failKey = 'chip-in:collection-previews:v1';
    await expect(deleteCollectionPreview(collection.id, payments, dashboards)).rejects.toThrow(
      'blocked deletion',
    );
    expect(dashboards.get(collection.id)).not.toBeNull();
    expect(await payments.get(collection.id)).not.toBeNull();
    failKey = 'chip-in:collection-dashboards:v1';
    await expect(deleteCollectionPreview(collection.id, payments, dashboards)).rejects.toThrow(
      'dashboard deletion',
    );
    expect(dashboards.get(collection.id)).not.toBeNull();
    failKey = '';
    await deleteCollectionPreview(collection.id, payments, dashboards);
    expect(dashboards.get(collection.id)).toBeNull();
    expect(await payments.get(collection.id)).toBeNull();
  });
});
