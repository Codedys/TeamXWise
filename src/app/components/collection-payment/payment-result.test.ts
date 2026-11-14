import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ChipInPreviewViewModel } from '@/adapters/presenters/chip-in-preview.view-model';
import type { PaymentReceiptViewModel } from '@/adapters/presenters/payment-receipt.view-model';
import { PaymentResult } from './payment-result';
import { ParticipantPicker } from './participant-picker';

const collection: ChipInPreviewViewModel = {
  id: 'chip-in-1',
  title: 'Rome trip',
  description: '',
  ownerName: 'John Doe',
  isOpen: true,
  invitationMessage: null,
  audience: 'group',
  currency: 'EUR',
  priceMinorUnits: 1500,
  deadline: null,
  limitType: 'none',
  spotLimit: 80,
  goalMinorUnits: 120_000,
  collectEmail: false,
  customQuestion: null,
  participants: [{ id: 'participant-1', name: 'Emma Ilves', status: 'pending' }],
  progress: { paidSpots: 0, receivedMinorUnits: 0 },
};

const pendingReceipt: PaymentReceiptViewModel = {
  id: 'receipt-1',
  requestId: 'bank-demo',
  participantId: 'participant-1',
  payerName: 'Emma Ilves',
  quantity: 1,
  sourceMinorUnits: 1500,
  sourceCurrency: 'EUR',
  payMinorUnits: 1500,
  payCurrency: 'EUR',
  rate: 1,
  method: 'bank',
  status: 'pending',
};

describe('payer preview presentation', () => {
  it('labels a pending bank transfer accurately', () => {
    const render = () =>
      renderToStaticMarkup(
        createElement(PaymentResult, {
          collection,
          receipt: pendingReceipt,
          onAnother: () => {},
          onConfirmed: () => {},
        }),
      );
    expect(render()).toContain('TRANSFER PENDING.');
    expect(render()).toContain('Simulate bank confirmation');
    expect(render()).not.toContain('BOOM. CHIPPED IN.');
  });

  it('labels a successful payment accurately', () => {
    const render = () =>
      renderToStaticMarkup(
        createElement(PaymentResult, {
          collection,
          receipt: { ...pendingReceipt, status: 'paid' },
          onAnother: () => {},
          onConfirmed: () => {},
        }),
      );
    expect(render()).toContain('BOOM. CHIPPED IN.');
    expect(render()).toContain('NO MONEY MOVED');
    expect(render()).toContain('chip-in-success.png');
  });

  it('shows a pending participant as unavailable to pick', () => {
    const picker = renderToStaticMarkup(
      createElement(ParticipantPicker, { collection, onPick: () => {} }),
    );
    expect(picker).toContain('Transfer pending');
    expect(picker).toContain('disabled');
  });
});
