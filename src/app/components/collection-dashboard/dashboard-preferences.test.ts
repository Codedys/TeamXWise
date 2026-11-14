import { describe, expect, it } from 'vitest';
import { createBrowserCollectionDashboardClient } from './browser-collection-dashboard-client';
import { createBrowserCollectionPreviewClient } from '../collection-preview/browser-collection-preview-client';
import { emptyCollectionDraft } from '../create-collection/create-collection-draft';
import { defaultDashboardPreferences } from './dashboard-settings';
describe('saved dashboard preferences', () => {
  it('persists reminder edits, co-hosts and completion dismissal without altering a different collection', async () => {
    const saved = new Map<string, string>();
    let id = 0;
    const storage = () => ({
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => {
        saved.set(key, value);
      },
    });
    const dashboards = createBrowserCollectionDashboardClient({ storage });
    const payments = createBrowserCollectionPreviewClient({
      storage,
      dashboards,
      id: () => `prefs-${++id}`,
      today: () => '2026-11-14',
      now: () => 1000,
    });
    const one = await payments.publish({
      ...emptyCollectionDraft(),
      title: 'One',
      audience: 'anyone',
      noDeadline: true,
    });
    const two = await payments.publish({
      ...emptyCollectionDraft(),
      title: 'Two',
      audience: 'anyone',
      noDeadline: true,
    });
    dashboards.activate(one.id);
    dashboards.activate(two.id);
    const prefs = defaultDashboardPreferences();
    prefs.rules[0].message = 'Please chip in, [name].';
    prefs.cohosts = ['Alex Kask'];
    prefs.completionDismissed = true;
    dashboards.savePreferences(one.id, prefs);
    expect(
      createBrowserCollectionDashboardClient({ storage }).get(one.id)?.preferences,
    ).toEqual(prefs);
    expect(dashboards.get(two.id)?.preferences.rules[0].message).toBe(
      defaultDashboardPreferences().rules[0].message,
    );
    dashboards.remove(one.id);
    expect(createBrowserCollectionDashboardClient({ storage }).get(one.id)).toBeNull();
  });
});
