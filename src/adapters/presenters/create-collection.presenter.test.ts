import { describe, expect, it } from 'vitest';

import { InvalidCollectionTitleError } from '@/domain/errors/invalid-collection-title.error';
import { CreateCollectionPresenter } from './create-collection.presenter';

describe('CreateCollectionPresenter', () => {
  it('formats a successful response into a currency-formatted view model', () => {
    const presenter = new CreateCollectionPresenter();

    presenter.presentSuccess({
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Ski trip 2026',
      targetAmountMinorUnits: 50000,
      currency: 'EUR',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(presenter.viewModel).toEqual({
      status: 'success',
      collection: {
        id: '11111111-1111-1111-1111-111111111111',
        title: 'Ski trip 2026',
        formattedAmount: '€500.00',
      },
    });
  });

  it('turns a domain error into a user-friendly error view model', () => {
    const presenter = new CreateCollectionPresenter();

    presenter.presentError(new InvalidCollectionTitleError('title cannot be empty'));

    expect(presenter.viewModel).toEqual({
      status: 'error',
      message: 'Collection title is invalid: title cannot be empty',
    });
  });
});
