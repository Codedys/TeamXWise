export type CollectionLimit = 'none' | 'spots' | 'goal';
export type CollectionAudience = 'group' | 'anyone';

/** Browser-only form state. Domain entities are created by the backend later. */
export interface CreateCollectionDraft {
  version: 4;
  invitationMessage: string | null;
  limitType: CollectionLimit;
  spotLimit: string;
  goalAmount: string;
  collectEmail: boolean;
  customQuestionEnabled: boolean;
  customQuestion: string;
  audience: CollectionAudience;
  audienceChosen: boolean;
  step: number;
  maxStep: number;
  title: string;
  description: string;
  peopleCount: string;
  amount: string;
  currency: 'EUR' | 'GBP' | 'USD';
  deadline: string;
  noDeadline: boolean;
  rawNames: string;
  names: string[];
  namesStage: 'paste' | 'edit';
}
export type DraftErrors = Partial<Record<keyof CreateCollectionDraft, string>>;
export const CREATE_COLLECTION_STEPS = [
  { label: 'Occasion', heading: 'What’s the occasion?' },
  { label: 'Who’s in', heading: 'Who’s chipping in?' },
  { label: 'People', heading: 'How many people are chipping in?' },
  { label: 'Amount', heading: 'How much each?' },
  { label: 'Pay by', heading: 'When should everyone pay by?' },
  { label: 'Names', heading: 'Who’s in?' },
  { label: 'Review', heading: 'Check it before it goes out' },
] as const;
export function emptyCollectionDraft(): CreateCollectionDraft {
  return {
    version: 4,
    invitationMessage: null,
    limitType: 'none',
    spotLimit: '80',
    goalAmount: '1200',
    collectEmail: false,
    customQuestionEnabled: false,
    customQuestion: '',
    audience: 'group',
    audienceChosen: false,
    step: 0,
    maxStep: 0,
    title: '',
    description: '',
    peopleCount: '12',
    amount: '60',
    currency: 'EUR',
    deadline: '',
    noDeadline: false,
    rawNames: '',
    names: [],
    namesStage: 'paste',
  };
}
/** Stable step IDs keep stored drafts independent of the visible branch length. */
export const COLLECTION_STEP = {
  occasion: 0,
  audience: 1,
  people: 2,
  price: 2,
  amount: 3,
  limit: 3,
  deadline: 4,
  names: 5,
  questions: 5,
  review: 6,
  share: 7,
} as const;
const OPEN_COLLECTION_STEPS = [
  { label: 'Occasion', heading: 'What’s the occasion?' },
  { label: 'Who’s in', heading: 'Who’s chipping in?' },
  { label: 'Price', heading: 'How much per person?' },
  { label: 'Limit', heading: 'Is there a limit?' },
  { label: 'Closes', heading: 'When does the link close?' },
  { label: 'Questions', heading: 'What do you need to know?' },
  { label: 'Review', heading: 'Check it before you share' },
] as const;
export function collectionSteps(draft: Pick<CreateCollectionDraft, 'audience'>) {
  const steps = draft.audience === 'anyone' ? OPEN_COLLECTION_STEPS : CREATE_COLLECTION_STEPS;
  return steps.map((step, id) => ({ ...step, id }));
}
export function openCollectionLimitSummary(draft: CreateCollectionDraft): string {
  if (draft.limitType === 'spots') return `${draft.spotLimit} spots`;
  if (draft.limitType === 'goal')
    return `Goal ${displayMoney(amountInMinorUnits(draft.goalAmount) ?? 0, draft.currency)}`;
  return 'No limit';
}
export function collectionQuestionsSummary(draft: CreateCollectionDraft): string {
  return [
    'Name',
    ...(draft.collectEmail ? ['email'] : []),
    ...(draft.customQuestionEnabled ? ['1 more'] : []),
  ].join(', ');
}
export function suggestCollectionAudience(title: string): CollectionAudience {
  return /\b(?:party|festival|fundrais(?:er|ing)|donation|charity|student union|community|public|club event)\b/iu.test(
    title,
  )
    ? 'anyone'
    : 'group';
}
export function chooseCollectionAudience(
  draft: CreateCollectionDraft,
  audience: CollectionAudience,
  chosen = true,
): CreateCollectionDraft {
  return {
    ...draft,
    audience,
    audienceChosen: chosen,
    // Retain all inputs, but revisit branch-specific steps before sharing.
    ...(draft.audience !== audience
      ? {
          step: Math.min(draft.step, COLLECTION_STEP.audience),
          maxStep: COLLECTION_STEP.audience,
        }
      : {}),
  };
}
export function nextCollectionStep(draft: CreateCollectionDraft): number {
  return collectionSteps(draft).find(({ id }) => id > draft.step)?.id ?? COLLECTION_STEP.share;
}
export function previousCollectionStep(draft: CreateCollectionDraft): number {
  return (
    collectionSteps(draft)
      .filter(({ id }) => id < draft.step)
      .at(-1)?.id ?? COLLECTION_STEP.occasion
  );
}
export function localDateInput(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
export function amountInMinorUnits(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 100_000_000 ? amount : null;
}
export function draftNames(names: readonly string[]): string[] {
  return names.map((name) => name.trim()).filter(Boolean);
}
export function formatDraftMoney(minorUnits: number, currency: string): string {
  return `${(minorUnits / 100).toFixed(2)} ${currency}`;
}
export function displayMoney(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
}
export function formatDraftDeadline(value: string): string {
  if (!isRealDate(value)) return 'Choose a date';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day, 12));
}
function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  );
}
export function validateDraftStep(
  step: number,
  draft: CreateCollectionDraft,
  today?: string,
): DraftErrors {
  const errors: DraftErrors = {};
  if (step === 0) {
    if (!draft.title.trim()) errors.title = 'Give your occasion a name to continue.';
    else if (draft.title.trim().length > 120)
      errors.title = 'Keep the name to 120 characters or fewer.';
    if (draft.description.length > 1000)
      errors.description = 'Keep the description to 1,000 characters or fewer.';
  }
  if (step === COLLECTION_STEP.audience && !['group', 'anyone'].includes(draft.audience))
    errors.audience = 'Choose who can chip in.';
  if (
    step === COLLECTION_STEP.people &&
    draft.audience === 'group' &&
    (!/^\d+$/.test(draft.peopleCount) ||
      Number(draft.peopleCount) < 1 ||
      Number(draft.peopleCount) > 500)
  )
    errors.peopleCount = 'Enter a whole number from 1 to 500.';
  if (
    step === (draft.audience === 'anyone' ? COLLECTION_STEP.price : COLLECTION_STEP.amount)
  ) {
    if (amountInMinorUnits(draft.amount) === null)
      errors.amount = 'Enter an amount from 0.01 to 1,000,000, with up to 2 decimal places.';
    if (!['EUR', 'GBP', 'USD'].includes(draft.currency))
      errors.currency = 'Choose an available currency.';
  }
  if (draft.audience === 'anyone' && step === COLLECTION_STEP.limit) {
    if (!['none', 'spots', 'goal'].includes(draft.limitType))
      errors.limitType = 'Choose a limit option.';
    if (
      draft.limitType === 'spots' &&
      (!/^\d+$/.test(draft.spotLimit) ||
        Number(draft.spotLimit) < 1 ||
        Number(draft.spotLimit) > 1_000_000)
    )
      errors.spotLimit = 'Enter a whole number of spots from 1 to 1,000,000.';
    if (draft.limitType === 'goal' && amountInMinorUnits(draft.goalAmount) === null)
      errors.goalAmount = 'Enter a goal from 0.01 to 1,000,000, with up to 2 decimal places.';
  }
  if (
    draft.audience === 'anyone' &&
    step === COLLECTION_STEP.questions &&
    draft.customQuestionEnabled
  ) {
    if (!draft.customQuestion.trim())
      errors.customQuestion = 'Write the question, or switch it off to continue.';
    else if (draft.customQuestion.trim().length > 200)
      errors.customQuestion = 'Keep your question to 200 characters or fewer.';
  }
  if (step === COLLECTION_STEP.deadline && !draft.noDeadline) {
    if (!isRealDate(draft.deadline)) errors.deadline = 'Choose a valid payment date.';
    else if (draft.deadline < (today ?? localDateInput()))
      errors.deadline = 'Choose today or a later date.';
  }
  if (step === COLLECTION_STEP.names && draft.audience === 'group') {
    const names = draftNames(draft.names),
      expected = Number(draft.peopleCount);
    if (draft.namesStage !== 'edit')
      errors.names = 'Tidy your list, then check each name before continuing.';
    else if (names.length !== draft.names.length)
      errors.names = `Fill in or remove the empty name fields. You need exactly ${expected} names.`;
    else if (names.length !== expected) {
      const difference = Math.abs(expected - names.length);
      errors.names =
        names.length > expected
          ? `Remove ${difference} ${difference === 1 ? 'name' : 'names'}, or change the number in People. You selected ${expected} people.`
          : `Add ${expected - names.length} more ${expected - names.length === 1 ? 'name' : 'names'}. You selected ${expected} people.`;
    } else if (names.some((name) => name.length > 100))
      errors.names = 'Keep each name to 100 characters or fewer.';
    else if (
      new Set(names.map((name) => name.normalize('NFC').toLocaleLowerCase('en'))).size !==
      names.length
    )
      errors.names =
        'Two names are the same. Add an initial or surname so each person is distinct.';
  }
  if (step === COLLECTION_STEP.review && draft.invitationMessage !== null) {
    if (!draft.invitationMessage.trim())
      errors.invitationMessage = 'Write an invitation or reset the suggested message.';
    else if (draft.invitationMessage.length > 2000)
      errors.invitationMessage = 'Keep your message to 2,000 characters or fewer.';
  }
  return errors;
}
export function firstInvalidDraftStep(
  draft: CreateCollectionDraft,
  destination: number,
  today = localDateInput(),
): { step: number; errors: DraftErrors } | null {
  for (const { id: step } of collectionSteps(draft).filter(
    ({ id }) => id < Math.min(destination, COLLECTION_STEP.share),
  )) {
    const errors = validateDraftStep(step, draft, today);
    if (Object.keys(errors).length) return { step, errors };
  }
  return null;
}
export function parseStoredDraft(
  value: string | null,
  today = localDateInput(),
): CreateCollectionDraft {
  if (!value) return emptyCollectionDraft();
  try {
    const data: unknown = JSON.parse(value);
    if (typeof data !== 'object' || data === null) return emptyCollectionDraft();
    const d = data as Record<string, unknown>;
    if (d.version !== 1 && d.version !== 2 && d.version !== 3 && d.version !== 4)
      return emptyCollectionDraft();
    if (
      ['title', 'description', 'peopleCount', 'amount', 'deadline'].some(
        (key) => typeof d[key] !== 'string',
      ) ||
      typeof d.noDeadline !== 'boolean'
    )
      return emptyCollectionDraft();
    if (
      typeof d.step !== 'number' ||
      !Number.isInteger(d.step) ||
      d.step < 0 ||
      d.step > (Number(d.version) >= 3 ? 7 : 6) ||
      typeof d.maxStep !== 'number' ||
      !Number.isInteger(d.maxStep) ||
      d.maxStep < d.step ||
      d.maxStep > (Number(d.version) >= 3 ? 7 : 6)
    )
      return emptyCollectionDraft();
    if (d.currency !== 'EUR' && d.currency !== 'GBP' && d.currency !== 'USD')
      return emptyCollectionDraft();
    if (
      Number(d.version) >= 3 &&
      ((d.audience !== 'group' && d.audience !== 'anyone') ||
        typeof d.audienceChosen !== 'boolean')
    )
      return emptyCollectionDraft();
    if (
      d.version === 4 &&
      (!['none', 'spots', 'goal'].includes(String(d.limitType)) ||
        typeof d.spotLimit !== 'string' ||
        d.spotLimit.length > 7 ||
        typeof d.goalAmount !== 'string' ||
        d.goalAmount.length > 20 ||
        typeof d.collectEmail !== 'boolean' ||
        typeof d.customQuestionEnabled !== 'boolean' ||
        typeof d.customQuestion !== 'string' ||
        d.customQuestion.length > 200)
    )
      return emptyCollectionDraft();
    let names: string[], rawNames: string, namesStage: 'paste' | 'edit';
    if (d.version === 1) {
      if (typeof d.names !== 'string') return emptyCollectionDraft();
      names = d.names
        .split(/\r?\n/)
        .map((name) => name.trim())
        .filter(Boolean);
      rawNames = d.names;
      namesStage = names.length ? 'edit' : 'paste';
    } else {
      if (
        !Array.isArray(d.names) ||
        d.names.some((name) => typeof name !== 'string') ||
        typeof d.rawNames !== 'string' ||
        (d.namesStage !== 'paste' && d.namesStage !== 'edit')
      )
        return emptyCollectionDraft();
      names = d.names;
      rawNames = d.rawNames;
      namesStage = d.namesStage;
    }
    if (
      (d.title as string).length > 120 ||
      (d.description as string).length > 1000 ||
      (d.peopleCount as string).length > 3 ||
      (d.amount as string).length > 20 ||
      (d.deadline as string).length > 10 ||
      names.length > 500 ||
      names.some((name) => name.length > 100) ||
      rawNames.length > 50_500
    )
      return emptyCollectionDraft();
    const draft: CreateCollectionDraft = {
      ...emptyCollectionDraft(),
      version: 4,
      invitationMessage:
        typeof d.invitationMessage === 'string' && d.invitationMessage.length <= 2000
          ? d.invitationMessage
          : null,
      ...(d.version === 4
        ? {
            limitType: d.limitType as CollectionLimit,
            spotLimit: d.spotLimit as string,
            goalAmount: d.goalAmount as string,
            collectEmail: d.collectEmail as boolean,
            customQuestionEnabled: d.customQuestionEnabled as boolean,
            customQuestion: d.customQuestion as string,
          }
        : {}),
      audience: Number(d.version) >= 3 ? (d.audience as CollectionAudience) : 'group',
      audienceChosen: Number(d.version) >= 3 ? (d.audienceChosen as boolean) : true,
      step: Number(d.version) >= 3 ? d.step : d.step === 0 ? 0 : d.step + 1,
      maxStep: Number(d.version) >= 3 ? d.maxStep : d.maxStep === 0 ? 0 : d.maxStep + 1,
      title: d.title as string,
      description: d.description as string,
      peopleCount: d.peopleCount as string,
      amount: d.amount as string,
      currency: d.currency,
      deadline: d.deadline as string,
      noDeadline: d.noDeadline,
      names,
      rawNames,
      namesStage,
    };
    if (d.version === 3 && draft.audience === 'anyone') {
      // Old open-link drafts had no limit/questions steps. Preserve inputs and review the new settings.
      draft.step =
        draft.step === 3
          ? COLLECTION_STEP.price
          : draft.step >= 4
            ? COLLECTION_STEP.limit
            : draft.step;
      draft.maxStep = Math.min(
        Math.max(draft.step, draft.maxStep === 3 ? COLLECTION_STEP.price : draft.maxStep),
        COLLECTION_STEP.limit,
      );
    }
    if (
      draft.step !== COLLECTION_STEP.share &&
      !collectionSteps(draft).some(({ id }) => id === draft.step)
    )
      return {
        ...draft,
        step: COLLECTION_STEP.audience,
        maxStep: COLLECTION_STEP.audience,
      };
    for (const { id: step } of collectionSteps(draft).filter(
      ({ id }) => id < Math.min(draft.step, COLLECTION_STEP.review),
    )) {
      if (Object.keys(validateDraftStep(step, draft, today)).length)
        return { ...draft, step, maxStep: step };
    }
    return draft;
  } catch {
    return emptyCollectionDraft();
  }
}
export function invitationPreview(draft: CreateCollectionDraft): string {
  return draft.invitationMessage ?? suggestedInvitationMessage(draft);
}
export function suggestedInvitationMessage(draft: CreateCollectionDraft): string {
  const amount = displayMoney(amountInMinorUnits(draft.amount) ?? 0, draft.currency);
  const deadline = draft.noDeadline
    ? ''
    : ` by ${formatDraftDeadline(draft.deadline).replace(/ \d{4}$/, '')}`;
  if (draft.audience === 'anyone') {
    const closing = draft.noDeadline
      ? 'No closing date.'
      : `Open until ${formatDraftDeadline(draft.deadline).replace(/ \d{4}$/, '')}.`;
    const limit =
      draft.limitType === 'spots'
        ? `${draft.spotLimit} spots.`
        : draft.limitType === 'goal'
          ? `Closes when we reach ${displayMoney(amountInMinorUnits(draft.goalAmount) ?? 0, draft.currency)}. The last full-price contribution may take us over the goal.`
          : 'No limit on the number of people.';
    return `${draft.title.trim()} is on! Chip in ${amount} per person${draft.limitType === 'spots' ? ' to get your spot' : ''}. ${limit} ${closing} Add your name when you pay. No app needed: [link]`;
  }
  return `${draft.title.trim()}\nPlease chip in ${amount}${deadline}.\nPay here: [link]`;
}
export function draftInvitation(draft: CreateCollectionDraft): string {
  return `${invitationPreview(draft)}\n\nFrontend preview — a payment link has not been created.`;
}
