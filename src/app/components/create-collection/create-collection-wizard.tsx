'use client';

import Link from 'next/link';
import { activateChipInDashboardAction } from '@/app/actions';
import { CollectionSharePanel } from '../collection-sharing/collection-share-panel';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition, type FormEvent } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  COLLECTION_STEP,
  collectionSteps,
  openCollectionLimitSummary,
  collectionQuestionsSummary,
  chooseCollectionAudience,
  suggestCollectionAudience,
  nextCollectionStep,
  previousCollectionStep,
  amountInMinorUnits,
  displayMoney,
  draftNames,
  firstInvalidDraftStep,
  validateDraftStep,
  type CreateCollectionDraft,
  type DraftErrors,
} from './create-collection-draft';
import {
  resetCollectionDraft,
  updateCollectionDraft,
  useCollectionDraft,
} from './create-collection-draft-store';
import { CollectionLimitStep } from './collection-limit-step';
import { CollectionQuestionsStep } from './collection-questions-step';
import { CollectionAudienceStep } from './collection-audience-step';
import { PeopleDial } from './people-dial';
import { ContributionStep } from './contribution-step';
import { DeadlineCalendar } from './deadline-calendar';
import { ParticipantListStep } from './participant-list-step';
import { parseParticipantList } from './participant-list-parser';
import { CollectionReview } from './collection-review';
import { shortDeadline } from './calendar-date';
import styles from './create-collection-wizard.module.css';

const IDEAS = ['Class trip to Rome', 'Gift for Anna', 'Team fees', 'Summer party'];

export function CreateCollectionWizard({ className = '' }: { className?: string }) {
  const router = useRouter();
  const { draft, storageUnavailable } = useCollectionDraft();
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [cancelling, startCancelTransition] = useTransition();
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);
  const [cancelError, setCancelError] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const steps = collectionSteps(draft);
  const sharing = draft.step === COLLECTION_STEP.share;
  const stepIndex = steps.findIndex(({ id }) => id === draft.step);
  const currentStep = steps[stepIndex];
  const openCollection = draft.audience === 'anyone';
  const names = draftNames(draft.names);
  const amount = amountInMinorUnits(draft.amount) ?? 0;
  const editingNames =
    !openCollection && draft.step === COLLECTION_STEP.names && draft.namesStage === 'edit';
  const namesInvalid = !!Object.keys(validateDraftStep(COLLECTION_STEP.names, draft)).length;
  const heading = sharing
    ? 'Share your collection preview'
    : editingNames
      ? 'Here’s your list'
      : currentStep.heading;
  const stepSummaries = [
    draft.title,
    openCollection ? 'Anyone with the link' : 'A set group of people',
    openCollection
      ? `${displayMoney(amount, draft.currency)} per person`
      : `${draft.peopleCount} people`,
    openCollection
      ? openCollectionLimitSummary(draft)
      : `${displayMoney(amount, draft.currency)} each`,
    draft.noDeadline
      ? openCollection
        ? 'No closing date'
        : 'No deadline'
      : shortDeadline(draft.deadline),
    openCollection ? collectionQuestionsSummary(draft) : `${names.length} names`,
  ];
  function changeSettings(changes: Partial<CreateCollectionDraft>) {
    updateCollectionDraft((previous) => ({ ...previous, ...changes }));
    setErrors({});
  }

  function field<K extends keyof CreateCollectionDraft>(
    key: K,
    value: CreateCollectionDraft[K],
  ) {
    updateCollectionDraft((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }
  function focusHeading() {
    requestAnimationFrame(() => headingRef.current?.focus());
  }
  function changeStep(step: number) {
    setStepDirection(step > draft.step ? 1 : -1);
    setErrors({});
    updateCollectionDraft((previous) => ({
      ...previous,
      step,
      maxStep: Math.max(step, previous.maxStep),
    }));
    focusHeading();
  }
  function visitStep(step: number) {
    // Sidebar shortcuts and the final action use the same validation as Continue.
    const invalid = firstInvalidDraftStep(draft, step);
    if (invalid) {
      changeStep(invalid.step);
      setErrors(invalid.errors);
      return;
    }
    changeStep(step);
  }
  function tidyNames() {
    if (!draft.rawNames.trim()) {
      setErrors({ rawNames: 'Paste a list of names to get started.' });
      return;
    }
    const parsed = parseParticipantList(draft.rawNames);
    if (!parsed.names.length) {
      setErrors({ rawNames: 'We couldn’t find any names. Try one name per line.' });
      return;
    }
    if (parsed.names.length > 500) {
      setErrors({
        rawNames: 'This preview supports up to 500 names. Please shorten the list.',
      });
      return;
    }
    if (parsed.names.some((name) => name.length > 100)) {
      setErrors({
        rawNames:
          'One entry is longer than 100 characters. Split the text into shorter name entries.',
      });
      return;
    }
    // The parser never changes peopleCount. A mismatched list remains editable.
    updateCollectionDraft((previous) => ({
      ...previous,
      names: parsed.names,
      namesStage: 'edit',
    }));
    setErrors({});
    focusHeading();
  }
  function continueForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sharing) return;
    if (
      !openCollection &&
      draft.step === COLLECTION_STEP.names &&
      draft.namesStage === 'paste'
    ) {
      tidyNames();
      return;
    }
    if (draft.step === COLLECTION_STEP.review) {
      visitStep(COLLECTION_STEP.share);
      return;
    }
    const nextErrors = validateDraftStep(draft.step, draft);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      formRef.current
        ?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[name="${Object.keys(nextErrors)[0]}"]`,
        )
        ?.focus();
      return;
    }
    if (draft.step === COLLECTION_STEP.occasion && !draft.audienceChosen) {
      const suggested = chooseCollectionAudience(
        draft,
        suggestCollectionAudience(draft.title),
        false,
      );
      updateCollectionDraft(() => ({
        ...suggested,
        step: COLLECTION_STEP.audience,
        maxStep: Math.max(suggested.maxStep, COLLECTION_STEP.audience),
      }));
      setErrors({});
      focusHeading();
      return;
    }
    changeStep(nextCollectionStep(draft));
  }
  function goBack() {
    if (editingNames) {
      updateCollectionDraft((previous) => ({
        ...previous,
        rawNames: previous.names.join('\n'),
        namesStage: 'paste',
      }));
      setErrors({});
      focusHeading();
    } else changeStep(previousCollectionStep(draft));
  }
  function errorFor(key: keyof CreateCollectionDraft) {
    return errors[key] ? (
      <p className={styles.error} id={`error-${key}`} role="alert">
        {errors[key]}
      </p>
    ) : null;
  }
  function renderStep() {
    switch (draft.step) {
      case COLLECTION_STEP.occasion:
        return (
          <>
            <label className={styles.label} htmlFor="collection-title">
              Type any name you like
            </label>
            <input
              id="collection-title"
              name="title"
              className={`${styles.input} ${styles.titleInput}`}
              placeholder="e.g. Mia’s surprise party"
              value={draft.title}
              onChange={(event) => field('title', event.target.value)}
              maxLength={120}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'error-title' : undefined}
              autoComplete="off"
            />
            {errorFor('title')}
            <p className={styles.label}>Or pick an idea to start from</p>
            <div className={styles.suggestions}>
              {IDEAS.map((idea) => (
                <button
                  type="button"
                  key={idea}
                  className={styles.suggestion}
                  aria-pressed={draft.title === idea}
                  onClick={() => field('title', idea)}
                >
                  {idea}
                </button>
              ))}
            </div>
            <label className={styles.label} htmlFor="collection-description">
              Add a description <span>(optional)</span>
            </label>
            <textarea
              id="collection-description"
              name="description"
              className={styles.textarea}
              placeholder="e.g. Bus and museum tickets, 4 June. Bring a packed lunch."
              value={draft.description}
              onChange={(event) => field('description', event.target.value)}
              maxLength={1000}
              rows={3}
              aria-invalid={!!errors.description}
            />
            {errorFor('description')}
          </>
        );
      case COLLECTION_STEP.audience:
        return (
          <CollectionAudienceStep
            title={draft.title}
            value={draft.audience}
            onChange={(audience) => {
              updateCollectionDraft((previous) =>
                chooseCollectionAudience(previous, audience),
              );
              setErrors({});
            }}
          />
        );
      case COLLECTION_STEP.people:
        if (openCollection)
          return (
            <ContributionStep
              draft={draft}
              onAmountChange={(value) => field('amount', value)}
              onCurrencyChange={(value) => field('currency', value)}
              error={errors.amount}
            />
          );
        return (
          <>
            <p className={styles.description} id="people-dial-help">
              Turn the dial: drag it, scroll, use the arrow keys or type a number. The names
              list must match this number.
            </p>
            <PeopleDial
              value={draft.peopleCount}
              onChange={(value) => field('peopleCount', value)}
              invalid={!!errors.peopleCount}
            />
            {errorFor('peopleCount')}
          </>
        );
      case COLLECTION_STEP.amount:
        if (openCollection)
          return (
            <CollectionLimitStep draft={draft} onChange={changeSettings} errors={errors} />
          );
        return (
          <ContributionStep
            draft={draft}
            onAmountChange={(value) => field('amount', value)}
            onCurrencyChange={(value) => field('currency', value)}
            error={errors.amount}
          />
        );
      case COLLECTION_STEP.deadline:
        return (
          <DeadlineCalendar
            mode={openCollection ? 'closes' : 'pay-by'}
            value={draft.deadline}
            noDeadline={draft.noDeadline}
            onChange={(value) => field('deadline', value)}
            onNoDeadlineChange={(value) => {
              field('noDeadline', value);
              setErrors({});
            }}
            error={errors.deadline}
          />
        );
      case COLLECTION_STEP.names:
        if (openCollection)
          return (
            <CollectionQuestionsStep draft={draft} onChange={changeSettings} errors={errors} />
          );
        return (
          <ParticipantListStep
            draft={draft}
            onRawChange={(value) => field('rawNames', value)}
            onNamesChange={(value) => field('names', value)}
            error={errors.rawNames}
          />
        );
      case COLLECTION_STEP.review:
        return (
          <CollectionReview
            draft={draft}
            onMessageChange={(value) => field('invitationMessage', value)}
            messageError={errors.invitationMessage}
          />
        );
      case COLLECTION_STEP.share:
        return <CollectionSharePanel draft={draft} onPublished={setPublishedId} />;
    }
  }
  const continueLabel =
    !openCollection && draft.step === COLLECTION_STEP.names
      ? editingNames
        ? 'Review'
        : 'Tidy my list'
      : draft.step === COLLECTION_STEP.review
        ? openCollection
          ? 'Get my link'
          : 'Send it out'
        : 'Continue';

  function cancelSetup() {
    setErrors({});
    setCancelError('');
    if (!resetCollectionDraft()) {
      setCancelError(
        'The forms have been reset for this visit, but your browser blocked removal of the saved draft.',
      );
      focusHeading();
      return;
    }
    // Pending navigation must not persist when Next.js restores this page.
    startCancelTransition(() => {
      router.replace('/chip-in');
    });
  }

  if (cancelling) {
    return (
      <main className={`${styles.screen} ${className}`}>
        <div className={styles.cancelState} role="status">
          Returning to Chip in…
        </div>
      </main>
    );
  }

  const stepVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 28 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -20 }),
  };

  return (
    <MotionConfig reducedMotion="user">
    <main className={`${styles.screen} ${className}`}>
      <div className={styles.wizard}>
        <aside className={styles.sidebar} aria-label="Collection setup progress">
          <Link href="/chip-in" className={styles.brand} aria-label="Back to Chip in">
            CHIP IN
          </Link>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step.id}>
                <button
                  type="button"
                  className={`${styles.stepButton} ${step.id === draft.step ? styles.activeStep : ''} ${step.id < draft.step ? styles.completedStep : ''}`}
                  onClick={() => visitStep(step.id)}
                  disabled={
                    step.id > draft.maxStep ||
                    (step.id >= COLLECTION_STEP.review && namesInvalid)
                  }
                  aria-label={`${index + 1}. ${step.label}${step.id < draft.step && stepSummaries[step.id] ? `: ${stepSummaries[step.id]}` : ''}`}
                  aria-current={step.id === draft.step ? 'step' : undefined}
                >
                  <span className={styles.stepNumber}>
                    {step.id < draft.step ? '✓' : index + 1}
                  </span>
                  <span className={styles.stepCopy}>
                    <span>{step.label}</span>
                    {step.id < draft.step && stepSummaries[step.id] && (
                      <small>{stepSummaries[step.id]}</small>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className={styles.concept}>
            Concept, built at Wise Hackathon
            <br />
            2026
          </p>
        </aside>
        <form ref={formRef} className={styles.form} onSubmit={continueForm} noValidate>
          <div className={styles.formContent}>
            <div className={styles.stepHeader}>
              <p className={styles.stepCount}>
                {sharing ? 'Share preview' : `Step ${stepIndex + 1} of ${steps.length}`}
              </p>
              <button type="button" className={styles.cancelButton} onClick={cancelSetup}>
                Cancel
              </button>
            </div>
            <AnimatePresence mode="wait" initial={false} custom={stepDirection}>
              <motion.div
                key={draft.step}
                custom={stepDirection}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 ref={headingRef} tabIndex={-1} className={styles.heading}>
                  {heading}
                </h1>
                {renderStep()}
                {cancelError && (
                  <p className={styles.error} role="alert">
                    {cancelError}
                  </p>
                )}
                {errors.names && draft.step !== COLLECTION_STEP.names && (
                  <p className={styles.error} role="alert">
                    {errors.names}
                  </p>
                )}
                {storageUnavailable && (
                  <p className={styles.help} role="status">
                    Browser storage is unavailable. Your draft will only last for this visit.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className={styles.actions}>
            {draft.step === 0 ? (
              <Link className={styles.backButton} href="/chip-in">
                Back
              </Link>
            ) : (
              <button type="button" className={styles.backButton} onClick={goBack}>
                Back
              </button>
            )}
            {!sharing ? (
              <button
                className={styles.continueButton}
                type="submit"
                disabled={editingNames && namesInvalid}
                aria-describedby={editingNames ? 'names-count' : undefined}
              >
                {continueLabel}
              </button>
            ) : (
              <button
                type="button"
                className={styles.continueButton}
                disabled={!publishedId}
                onClick={() => {
                  if (!publishedId) return;
                  void activateChipInDashboardAction(publishedId).finally(() => {
                    resetCollectionDraft();
                    router.push('/');
                  });
                }}
              >
                Done
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
    </MotionConfig>
  );
}
