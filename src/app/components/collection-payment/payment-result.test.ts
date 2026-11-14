import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { emptyCollectionDraft } from '../create-collection/create-collection-draft';
import { createBrowserCollectionPreviewClient } from '../collection-preview/browser-collection-preview-client';
import { PaymentResult } from './payment-result';
import { ParticipantPicker } from './participant-picker';

describe('payer preview presentation', () => {
  it('labels simulated success and pending bank transfers accurately', async () => {
    let id = 0;
    const storage = new Map<string, string>();
    const client = createBrowserCollectionPreviewClient({
      storage: () => ({
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => {
          storage.set(key, value);
        },
      }),
      id: () => `test-${++id}`,
      today: () => '2026-11-14',
    });
    const collection = await client.publish({
      ...emptyCollectionDraft(),
      title: 'Rome trip',
      peopleCount: '1',
      amount: '15',
      noDeadline: true,
      names: ['Emma Ilves'],
      namesStage: 'edit',
    });
    const pending = await client.submit({
      collectionId: collection.id,
      participantId: collection.participants[0].id,
      requestId: 'bank-demo',
      payerName: 'Emma Ilves',
      quantity: 1,
      email: '',
      answer: '',
      currency: 'EUR',
      method: 'bank',
    });
    const render = () =>
      renderToStaticMarkup(
        createElement(PaymentResult, {
          collection,
          receipt: pending,
          client,
          onAnother: () => {},
          onConfirmed: () => {},
        }),
      );
    expect(render()).toContain('TRANSFER PENDING.');
    expect(render()).toContain('Simulate bank confirmation');
    expect(render()).not.toContain('BOOM. CHIPPED IN.');
    pending.status = 'paid';
    expect(render()).toContain('BOOM. CHIPPED IN.');
    expect(render()).toContain('NO MONEY MOVED');
    expect(render()).toContain('chip-in-success.png');
    const current = (await client.get(collection.id))!;
    const picker = renderToStaticMarkup(
      createElement(ParticipantPicker, { collection: current, onPick: () => {} }),
    );
    expect(picker).toContain('Transfer pending');
    expect(picker).toContain('disabled');
  });
});
