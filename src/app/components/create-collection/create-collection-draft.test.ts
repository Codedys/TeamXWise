import { describe, expect, it, vi } from 'vitest';
import {
  COLLECTION_STEP as STEP,
  collectionSteps,
  nextCollectionStep,
  previousCollectionStep,
  chooseCollectionAudience,
  suggestCollectionAudience,
  amountInMinorUnits,
  displayMoney,
  draftInvitation,
  invitationPreview,
  draftNames,
  emptyCollectionDraft,
  firstInvalidDraftStep,
  parseStoredDraft,
  validateDraftStep,
} from './create-collection-draft';

const validDraft = () => ({
  ...emptyCollectionDraft(),
  title: 'Class trip to Rome',
  peopleCount: '12',
  amount: '60',
  deadline: '2026-11-28',
  names: Array.from({ length: 12 }, (_, i) => `Person ${i + 1}`),
  rawNames: '',
  namesStage: 'edit' as const,
});
const TODAY = '2026-11-13';

describe('frontend collection draft', () => {
  it('does not read the clock while prerendering non-date fields', () => {
    const clock = vi.spyOn(globalThis, 'Date');
    try {
      for (const step of [0, 1, 2, 3, 5]) validateDraftStep(step, validDraft());
      expect(clock).not.toHaveBeenCalled();
    } finally {
      clock.mockRestore();
    }
  });
  it('calculates contributions in exact minor units and renders the reference total', () => {
    expect(amountInMinorUnits('0.29')).toBe(29);
    expect(amountInMinorUnits('15,50')).toBe(1550);
    expect(amountInMinorUnits('1.1')).toBe(110);
    expect(displayMoney(12 * 6000, 'EUR')).toBe('€720');
    expect(displayMoney(1234, 'EUR')).toBe('€12.34');
    for (const value of ['0', '-1', '1.999', 'Infinity', '1e3', '1000000.01', ''])
      expect(amountInMinorUnits(value)).toBeNull();
  });
  it('validates occasion, count and contribution independently', () => {
    const draft = validDraft();
    for (let step = 0; step < 5; step++)
      expect(validateDraftStep(step, draft, TODAY)).toEqual({});
    expect(validateDraftStep(0, { ...draft, title: '   ' })).toHaveProperty('title');
    for (const peopleCount of ['0', '1.5', '501', '-2', ''])
      expect(validateDraftStep(2, { ...draft, peopleCount })).toHaveProperty('peopleCount');
    expect(validateDraftStep(3, { ...draft, amount: '0.001' })).toHaveProperty('amount');
  });
  it('requires exactly twelve names when twelve people were selected', () => {
    const draft = validDraft();
    expect(validateDraftStep(5, { ...draft, names: draft.names.slice(0, 11) }).names).toMatch(
      /Add 1 more name/,
    );
    expect(validateDraftStep(5, draft)).toEqual({});
    expect(
      validateDraftStep(5, { ...draft, names: [...draft.names, 'Extra Person'] }).names,
    ).toMatch(/Remove 1 name/);
    expect(draft.peopleCount).toBe('12');
  });
  it('does not allow empty, duplicate or unreviewed entries to satisfy the count', () => {
    const draft = validDraft();
    expect(draftNames([' Anna ', '', ' Marko '])).toEqual(['Anna', 'Marko']);
    expect(
      validateDraftStep(5, { ...draft, names: [...draft.names.slice(0, 11), ''] }).names,
    ).toMatch(/empty name/);
    expect(validateDraftStep(5, { ...draft, names: [...draft.names, ''] }).names).toMatch(
      /empty name/,
    );
    expect(
      validateDraftStep(5, { ...draft, names: [...draft.names.slice(0, 11), 'person 1'] })
        .names,
    ).toMatch(/same/);
    expect(validateDraftStep(5, { ...draft, namesStage: 'paste' }).names).toMatch(/Tidy/);
  });
  it('blocks sidebar and final navigation at Names until the fixed count matches', () => {
    const draft = { ...validDraft(), names: validDraft().names.slice(0, 11) };
    expect(firstInvalidDraftStep(draft, 6, TODAY)?.step).toBe(5);
    expect(firstInvalidDraftStep(draft, 7, TODAY)?.step).toBe(5);
    expect(firstInvalidDraftStep(validDraft(), 7, TODAY)).toBeNull();
  });
  it('preserves every name when the selected people count is changed', () => {
    const draft = { ...validDraft(), step: 6, maxStep: 6, peopleCount: '10' };
    const restored = parseStoredDraft(JSON.stringify(draft), TODAY);
    expect(restored.names).toHaveLength(12);
    expect(restored.peopleCount).toBe('10');
    expect(restored.step).toBe(5);
  });
  it('rejects past and impossible dates but allows an explicit no-deadline choice', () => {
    const draft = validDraft();
    expect(validateDraftStep(4, { ...draft, deadline: '2026-11-12' }, TODAY)).toHaveProperty(
      'deadline',
    );
    expect(
      validateDraftStep(4, { ...draft, deadline: '2026-02-30' }, '2026-01-01'),
    ).toHaveProperty('deadline');
    expect(validateDraftStep(4, { ...draft, deadline: TODAY }, TODAY)).toEqual({});
    expect(validateDraftStep(4, { ...draft, deadline: '', noDeadline: true })).toEqual({});
  });
  it('restores v4 progress and safely resets corrupt storage', () => {
    const draft = { ...validDraft(), step: 4, maxStep: 4 };
    expect(parseStoredDraft(JSON.stringify(draft), TODAY)).toEqual(draft);
    for (const value of [
      null,
      '',
      'bad json',
      'null',
      '{}',
      JSON.stringify({ ...draft, step: 99 }),
      JSON.stringify({ ...draft, maxStep: 1 }),
      JSON.stringify({ ...draft, names: null }),
      JSON.stringify({ ...draft, names: [false] }),
      JSON.stringify({ ...draft, namesStage: 'bad' }),
      JSON.stringify({ ...draft, currency: 'ZZZ' }),
    ])
      expect(parseStoredDraft(value, TODAY)).toEqual(emptyCollectionDraft());
  });
  it('migrates existing v1 drafts without losing manually entered names', () => {
    const current = validDraft();
    const legacy = {
      ...current,
      version: 1,
      step: 5,
      maxStep: 5,
      names: current.names.join('\n'),
    };
    const migrated = parseStoredDraft(JSON.stringify(legacy), TODAY);
    expect(migrated.version).toBe(4);
    expect(migrated.names).toEqual(current.names);
    expect(migrated.namesStage).toBe('edit');
    expect(migrated.step).toBe(6);
  });
  it('rewinds invalid or expired saved progress before rendering the review', () => {
    const draft = { ...validDraft(), step: 6, maxStep: 6 };
    expect(parseStoredDraft(JSON.stringify({ ...draft, title: '' }), TODAY).step).toBe(0);
    expect(parseStoredDraft(JSON.stringify({ ...draft, deadline: '' }), TODAY).step).toBe(4);
    expect(parseStoredDraft(JSON.stringify(draft), '2026-11-29').step).toBe(4);
  });
  it('builds distinct seven-step group and open-link flows', () => {
    const group = validDraft();
    expect(collectionSteps(group)).toHaveLength(7);
    const open = { ...group, audience: 'anyone' as const, step: STEP.audience };
    expect(collectionSteps(open).map(({ id }) => id)).toEqual([
      STEP.occasion,
      STEP.audience,
      STEP.price,
      STEP.limit,
      STEP.deadline,
      STEP.questions,
      STEP.review,
    ]);
    expect(nextCollectionStep(open)).toBe(STEP.price);
    expect(previousCollectionStep({ ...open, step: STEP.review })).toBe(STEP.questions);
    expect(nextCollectionStep({ ...open, step: STEP.review })).toBe(STEP.share);
  });
  it('requires an amount and date but no roster for anyone with the link', () => {
    const open = {
      ...validDraft(),
      audience: 'anyone' as const,
      peopleCount: '',
      names: [],
      namesStage: 'paste' as const,
    };
    expect(firstInvalidDraftStep(open, STEP.share, TODAY)).toBeNull();
    expect(firstInvalidDraftStep({ ...open, amount: '' }, STEP.share, TODAY)?.step).toBe(
      STEP.price,
    );
    expect(firstInvalidDraftStep({ ...open, deadline: '' }, STEP.share, TODAY)?.step).toBe(
      STEP.deadline,
    );
    expect(draftInvitation(open)).toContain('Add your name when you pay.');
  });
  it('keeps inputs when switching branches and revalidates the fixed roster', () => {
    const group = { ...validDraft(), step: STEP.review, maxStep: STEP.review };
    const open = chooseCollectionAudience(group, 'anyone');
    expect(open.step).toBe(STEP.audience);
    expect(open.maxStep).toBe(STEP.audience);
    expect(open.names).toEqual(group.names);
    const restored = chooseCollectionAudience(open, 'group');
    expect(restored.amount).toBe(group.amount);
    expect(restored.deadline).toBe(group.deadline);
    expect(firstInvalidDraftStep({ ...restored, names: [] }, STEP.review, TODAY)?.step).toBe(
      STEP.names,
    );
    expect(suggestCollectionAudience('Student Union party')).toBe('anyone');
    expect(suggestCollectionAudience('Class trip to Rome')).toBe('group');
  });
  it('migrates v2 progress and restores open-link drafts without demanding names', () => {
    const legacy = { ...validDraft(), version: 2, step: 4, maxStep: 5 };
    const migrated = parseStoredDraft(JSON.stringify(legacy), TODAY);
    expect(migrated).toMatchObject({
      version: 4,
      audience: 'group',
      audienceChosen: true,
      step: STEP.names,
      maxStep: STEP.review,
    });
    const open = {
      ...validDraft(),
      audience: 'anyone',
      peopleCount: '',
      names: [],
      step: STEP.review,
      maxStep: STEP.review,
    };
    expect(parseStoredDraft(JSON.stringify(open), TODAY)).toEqual(open);
  });
  it('rejects corrupt audience or limit shapes and rewinds invalid active settings', () => {
    const draft = { ...validDraft(), step: STEP.review, maxStep: STEP.review };
    for (const changes of [
      { audience: 'invalid' },
      { limitType: 'invalid' },
      { collectEmail: 'yes' },
    ])
      expect(parseStoredDraft(JSON.stringify({ ...draft, ...changes }), TODAY)).toEqual(
        emptyCollectionDraft(),
      );
    expect(
      parseStoredDraft(
        JSON.stringify({
          ...draft,
          audience: 'anyone',
          limitType: 'spots',
          spotLimit: '0',
        }),
        TODAY,
      ).step,
    ).toBe(STEP.limit);
    expect(
      parseStoredDraft(
        JSON.stringify({
          ...draft,
          audience: 'anyone',
          customQuestionEnabled: true,
          customQuestion: '',
        }),
        TODAY,
      ).step,
    ).toBe(STEP.questions);
  });
  it('preserves old open-link details but asks the organiser to review the new limit step', () => {
    const legacy = {
      ...validDraft(),
      version: 3,
      audience: 'anyone',
      step: STEP.share,
      maxStep: STEP.share,
    };
    expect(parseStoredDraft(JSON.stringify(legacy), TODAY)).toMatchObject({
      version: 4,
      audience: 'anyone',
      amount: '60',
      deadline: '2026-11-28',
      step: STEP.limit,
      maxStep: STEP.limit,
      limitType: 'none',
    });
    const price = parseStoredDraft(JSON.stringify({ ...legacy, step: 3, maxStep: 3 }), TODAY);
    expect(price.step).toBe(STEP.price);
  });
  it('validates the selected limit only and retains inactive values', () => {
    const draft = {
      ...validDraft(),
      audience: 'anyone' as const,
      spotLimit: '0',
      goalAmount: 'bad',
    };
    expect(validateDraftStep(STEP.limit, draft)).toEqual({});
    expect(
      validateDraftStep(STEP.limit, { ...draft, limitType: 'spots' }).spotLimit,
    ).toBeDefined();
    expect(
      validateDraftStep(STEP.limit, { ...draft, limitType: 'goal' }).goalAmount,
    ).toBeDefined();
    expect(
      validateDraftStep(STEP.questions, { ...draft, customQuestionEnabled: true })
        .customQuestion,
    ).toBeDefined();
    expect(
      validateDraftStep(STEP.questions, { ...draft, customQuestionEnabled: false }),
    ).toEqual({});
  });
  it('preserves all open-link settings across reload and puts the selected rules in the invitation', () => {
    const draft = {
      ...validDraft(),
      audience: 'anyone' as const,
      step: STEP.share,
      maxStep: STEP.share,
      limitType: 'goal' as const,
      goalAmount: '100',
      amount: '15',
      collectEmail: true,
      customQuestionEnabled: true,
      customQuestion: 'Any allergies?',
    };
    expect(parseStoredDraft(JSON.stringify(draft), TODAY)).toEqual(draft);
    expect(draftInvitation(draft)).toContain('Closes when we reach €100');
    expect(draftInvitation({ ...draft, limitType: 'spots', spotLimit: '80' })).toContain(
      '80 spots.',
    );
    expect(draftInvitation({ ...draft, limitType: 'none', noDeadline: true })).toContain(
      'No closing date.',
    );
  });
  it('preserves an edited invitation on restore and supports automatic-message reset', () => {
    const draft = { ...validDraft(), invitationMessage: 'See you in Rome! [link]' };
    expect(parseStoredDraft(JSON.stringify(draft), '2026-11-14').invitationMessage).toBe(
      draft.invitationMessage,
    );
    expect(invitationPreview(draft)).toBe(draft.invitationMessage);
    expect(invitationPreview({ ...draft, invitationMessage: null })).toContain(
      '€60 by 28 Nov',
    );
    expect(
      validateDraftStep(STEP.review, { ...draft, invitationMessage: '   ' }).invitationMessage,
    ).toBeTruthy();
    expect(
      firstInvalidDraftStep({ ...draft, invitationMessage: '' }, STEP.share, '2026-11-14')
        ?.step,
    ).toBe(STEP.review);
    const legacy = { ...draft, invitationMessage: undefined };
    expect(
      parseStoredDraft(JSON.stringify(legacy), '2026-11-14').invitationMessage,
    ).toBeNull();
  });
  it('keeps names private and marks the copied invitation as a frontend preview', () => {
    const text = draftInvitation(validDraft());
    expect(text).toContain('€60 by 28 Nov');
    expect(text).toContain('[link]');
    expect(text).toContain('payment link has not been created');
    expect(text).not.toContain('Person 1');
  });
});
