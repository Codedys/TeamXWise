import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { emptyCollectionDraft } from './create-collection-draft';
import { ParticipantListStep } from './participant-list-step';

describe('participant list status', () => {
  it('shows the actual roster mismatch after the audience step is inserted', () => {
    const draft = { ...emptyCollectionDraft(), peopleCount: '3', namesStage: 'edit' as const, names: ['Karl', 'Jaan'] };
    const render = (names: string[]) => renderToStaticMarkup(createElement(ParticipantListStep, {
      draft: { ...draft, names }, onRawChange: () => {}, onNamesChange: () => {},
    }));
    expect(render(draft.names)).toContain('Add 1 more name.');
    expect(render(draft.names)).not.toContain('Your list is ready to review.');
    expect(render([...draft.names, 'Tiina'])).toContain('Your list is ready to review.');
  });
});
