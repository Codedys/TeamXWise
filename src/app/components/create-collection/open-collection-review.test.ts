import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { emptyCollectionDraft, type CreateCollectionDraft } from './create-collection-draft';
import { OpenCollectionReview } from './open-collection-review';
import { CollectionQuestionsStep } from './collection-questions-step';

const draft = (changes: Partial<CreateCollectionDraft> = {}): CreateCollectionDraft => ({
  ...emptyCollectionDraft(),
  audience: 'anyone',
  title: 'Student Union party',
  amount: '15',
  noDeadline: true,
  ...changes,
});
const review = (changes: Partial<CreateCollectionDraft>) =>
  renderToStaticMarkup(
    createElement(OpenCollectionReview, { draft: draft(changes), onMessageChange: () => {} }),
  );

describe('open-link review and question configuration', () => {
  it('shows the selected capacity and truthful closure details for each mode', () => {
    expect(review({ limitType: 'none' })).toContain('no limit on people');
    expect(review({ limitType: 'none' })).toContain('You close it');
    expect(review({ limitType: 'spots', spotLimit: '80' })).toContain('€1,200');
    expect(review({ limitType: 'spots', spotLimit: '80' })).toContain('When full');
    expect(review({ limitType: 'goal', goalAmount: '100' })).toContain('€105');
    expect(review({ limitType: 'goal', goalAmount: '100' })).toContain('At the goal');
  });
  it('includes enabled payment questions and excludes a disabled custom question', () => {
    const config = {
      collectEmail: true,
      customQuestionEnabled: true,
      customQuestion: 'Any allergies?',
    };
    expect(review(config)).toContain('Any allergies?');
    expect(review({ ...config, customQuestionEnabled: false })).not.toContain(
      'Any allergies?',
    );
    const html = renderToStaticMarkup(
      createElement(CollectionQuestionsStep, {
        draft: draft(config),
        errors: {},
        onChange: () => {},
      }),
    );
    expect(html).toContain('Always on');
    expect(html).toContain('Your question');
    expect(html).toContain('Any allergies?');
  });
});
