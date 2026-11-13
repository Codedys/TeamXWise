'use client';

import { useActionState } from 'react';

import type { CreateCollectionViewModel } from '@/adapters/presenters/create-collection.presenter';
import { createCollectionAction } from '@/app/actions';

const initialState: CreateCollectionViewModel | null = null;

export function CollectionForm() {
  const [state, formAction, isPending] = useActionState(
    createCollectionAction,
    initialState,
  );

  return (
    <form action={formAction} className="collection-form">
      <label>
        Title
        <input name="title" type="text" placeholder="Ski trip 2026" required maxLength={120} />
      </label>
      <label>
        Target amount
        <input name="targetAmount" type="number" step="0.01" min="0.01" required />
      </label>
      <label>
        Currency
        <input name="currency" type="text" placeholder="EUR" maxLength={3} required />
      </label>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating…' : 'Create collection'}
      </button>

      {state?.status === 'error' && <p role="alert">{state.message}</p>}
      {state?.status === 'success' && (
        <p role="status">
          Created &ldquo;{state.collection.title}&rdquo; ({state.collection.formattedAmount})
        </p>
      )}
    </form>
  );
}
