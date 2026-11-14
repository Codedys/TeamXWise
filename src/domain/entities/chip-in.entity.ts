import { InvalidChipInTitleError } from '../errors/invalid-chip-in-title.error';
import { ChipInClosedError } from '../errors/chip-in-closed.error';
import { ChipInCapacityExceededError } from '../errors/chip-in-capacity-exceeded.error';
import { InvalidContributionError } from '../errors/invalid-contribution.error';
import { ChipInId } from '../value-objects/chip-in-id.vo';
import { Money } from '../value-objects/money.vo';
import { Participant } from './participant.entity';
import { PaymentReceipt, type PaymentMethod } from './payment-receipt.entity';

const MAX_TITLE_LENGTH = 120;
/** Fixed illustrative rates — this is a demo FX conversion, never a real one. */
const DEMO_FX_RATES: Record<string, number> = { EUR: 1, GBP: 0.87, USD: 1.08 };

export type ChipInAudience = 'group' | 'anyone';
export type ChipInLimitType = 'none' | 'spots' | 'goal';

export interface ChipInProgress {
  paidSpots: number;
  receivedMinorUnits: number;
}

export interface ChipInProps {
  id: ChipInId;
  title: string;
  description: string;
  ownerName: string;
  isOpen: boolean;
  invitationMessage: string | null;
  audience: ChipInAudience;
  price: Money;
  deadline: string | null;
  limitType: ChipInLimitType;
  spotLimit: number;
  goal: Money;
  collectEmail: boolean;
  customQuestion: string | null;
  participants: Participant[];
  progress: ChipInProgress;
  createdAt: Date;
}

export interface ContributionQuote {
  sourceMinorUnits: number;
  sourceCurrency: string;
  payMinorUnits: number;
  payCurrency: string;
  rate: number;
}

interface AcceptPaymentInput {
  receiptId: string;
  requestId: string;
  participantId: string | null;
  payerName: string;
  quantity: number;
  currency: string;
  method: PaymentMethod;
  email: string;
  answer: string;
  expectedSourceMinorUnits?: number;
  today: string;
  now: Date;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A group payment pot shared via a single link — the real product behind the Chip-In demo. */
export class ChipIn {
  private constructor(private readonly props: ChipInProps) {}

  static create(props: ChipInProps): ChipIn {
    const title = props.title.trim();
    if (title.length === 0) {
      throw new InvalidChipInTitleError('title cannot be empty');
    }
    if (title.length > MAX_TITLE_LENGTH) {
      throw new InvalidChipInTitleError(`title cannot exceed ${MAX_TITLE_LENGTH} characters`);
    }
    return new ChipIn({ ...props, title });
  }

  get id(): ChipInId {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get ownerName(): string {
    return this.props.ownerName;
  }

  get isOpen(): boolean {
    return this.props.isOpen;
  }

  get invitationMessage(): string | null {
    return this.props.invitationMessage;
  }

  get audience(): ChipInAudience {
    return this.props.audience;
  }

  get price(): Money {
    return this.props.price;
  }

  get deadline(): string | null {
    return this.props.deadline;
  }

  get limitType(): ChipInLimitType {
    return this.props.limitType;
  }

  get spotLimit(): number {
    return this.props.spotLimit;
  }

  get goal(): Money {
    return this.props.goal;
  }

  get collectEmail(): boolean {
    return this.props.collectEmail;
  }

  get customQuestion(): string | null {
    return this.props.customQuestion;
  }

  get participants(): Participant[] {
    return [...this.props.participants];
  }

  get progress(): ChipInProgress {
    return { ...this.props.progress };
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /** Spots/price-units of headroom left for an 'anyone' link. Always null for 'group'. */
  private remainingSpots(): number | null {
    if (this.props.audience !== 'anyone') return null;
    if (this.props.limitType === 'spots') {
      return Math.max(0, this.props.spotLimit - this.props.progress.paidSpots);
    }
    if (this.props.limitType === 'goal') {
      return Math.max(
        0,
        Math.ceil(
          (this.props.goal.minorUnits - this.props.progress.receivedMinorUnits) /
            this.props.price.minorUnits,
        ),
      );
    }
    return null;
  }

  /** Why this link can't accept a new contribution right now, or null if it can. */
  closeReason(today: string): 'manual' | 'date' | 'spots' | 'goal' | null {
    if (!this.props.isOpen) return 'manual';
    if (this.props.deadline && today > this.props.deadline) return 'date';
    if (this.props.audience === 'anyone' && this.remainingSpots() === 0) {
      return this.props.limitType === 'goal' ? 'goal' : 'spots';
    }
    return null;
  }

  /** Whether every spot/the goal/every named participant has been paid for. */
  isComplete(): boolean {
    if (this.props.audience === 'group') {
      return (
        this.props.participants.length > 0 &&
        this.props.participants.every((person) => person.status === 'paid')
      );
    }
    return (
      (this.props.limitType === 'spots' &&
        this.props.progress.paidSpots >= this.props.spotLimit) ||
      (this.props.limitType === 'goal' &&
        this.props.progress.receivedMinorUnits >= this.props.goal.minorUnits)
    );
  }

  /** Only 'anyone' links are editable after publishing — a group's names/price are fixed. */
  reconfigure(settings: {
    isOpen: boolean;
    deadline: string | null;
    price: Money;
    limitType: ChipInLimitType;
    spotLimit: number;
    goal: Money;
    customQuestion: string | null;
    today: string;
  }): ChipIn {
    if (this.props.audience !== 'anyone') {
      throw new InvalidContributionError('Link settings are only available for open collections.');
    }
    if (settings.price.minorUnits < this.props.price.minorUnits) {
      throw new InvalidContributionError('The price can only be raised for new payers.');
    }
    if (settings.deadline && settings.deadline < settings.today) {
      throw new InvalidContributionError('Choose today or a later closing date.');
    }
    if (settings.limitType === 'spots' && settings.spotLimit <= this.props.progress.paidSpots) {
      throw new InvalidContributionError(
        'Leave at least one spot beyond the people who have already paid.',
      );
    }
    if (
      settings.limitType === 'goal' &&
      settings.goal.minorUnits <= this.props.progress.receivedMinorUnits
    ) {
      throw new InvalidContributionError('The goal must be above the amount already collected.');
    }
    return new ChipIn({
      ...this.props,
      isOpen: settings.isOpen,
      deadline: settings.deadline,
      price: settings.price,
      limitType: settings.limitType,
      spotLimit: settings.spotLimit,
      goal: settings.goal,
      customQuestion: settings.customQuestion,
    });
  }

  /** Demo currency conversion — illustrative only, mirrors the fixed `DEMO_FX_RATES`. */
  quote(currency: string, quantity: number): ContributionQuote {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1_000_000) {
      throw new InvalidContributionError('Enter a valid number of people.');
    }
    if (!(currency in DEMO_FX_RATES)) {
      throw new InvalidContributionError('Choose an available currency.');
    }
    const sourceMinorUnits = this.props.price.minorUnits * quantity;
    const rate = DEMO_FX_RATES[currency] / DEMO_FX_RATES[this.props.price.currency];
    const payMinorUnits = Math.round(sourceMinorUnits * rate);
    if (
      !Number.isSafeInteger(sourceMinorUnits) ||
      !Number.isSafeInteger(payMinorUnits) ||
      payMinorUnits < 1
    ) {
      throw new InvalidContributionError('This demo cannot quote that amount.');
    }
    return {
      sourceMinorUnits,
      sourceCurrency: this.props.price.currency,
      payMinorUnits,
      payCurrency: currency,
      rate,
    };
  }

  private ensureCanAccept(today: string, quantity: number, participantId: string | null): Participant | null {
    const reason = this.closeReason(today);
    if (reason === 'spots' || reason === 'goal') throw new ChipInCapacityExceededError(reason);
    if (reason) throw new ChipInClosedError(reason);
    if (this.props.audience === 'group') {
      if (quantity !== 1) throw new InvalidContributionError('Choose one name from the list.');
      const participant = this.props.participants.find((person) => person.id === participantId);
      if (!participant) throw new InvalidContributionError('Choose one name from the list.');
      if (participant.status === 'paid') {
        throw new InvalidContributionError('This person has already paid.');
      }
      if (participant.status === 'pending') {
        throw new InvalidContributionError('A transfer is already pending for this person.');
      }
      return participant;
    }
    const remaining = this.remainingSpots();
    if (remaining !== null && quantity > remaining) {
      throw new ChipInCapacityExceededError(this.props.limitType === 'goal' ? 'goal' : 'spots');
    }
    return null;
  }

  private withPaymentApplied(
    participant: Participant | null,
    sourceMinorUnits: number,
    quantity: number,
  ): ChipIn {
    const participants = participant
      ? this.props.participants.map((person) =>
          person.id === participant.id ? person.withStatus('paid') : person,
        )
      : this.props.participants;
    return new ChipIn({
      ...this.props,
      participants,
      progress: {
        paidSpots: this.props.progress.paidSpots + quantity,
        receivedMinorUnits: this.props.progress.receivedMinorUnits + sourceMinorUnits,
      },
    });
  }

  /**
   * Validates and records a brand-new contribution. Callers performing this for real must hold
   * a row lock on this aggregate first — this method only enforces the rule, it isn't atomic by
   * itself. Idempotency for retried `requestId`s is a persistence concern, handled by the gateway.
   */
  acceptNewPayment(input: AcceptPaymentInput): { chipIn: ChipIn; receipt: PaymentReceipt } {
    const participant = this.ensureCanAccept(input.today, input.quantity, input.participantId);
    const quote = this.quote(input.currency, input.quantity);
    if (
      input.expectedSourceMinorUnits !== undefined &&
      input.expectedSourceMinorUnits !== quote.sourceMinorUnits
    ) {
      throw new InvalidContributionError('The price changed. Review the updated quote before paying.');
    }
    const payerName = input.payerName.trim();
    if (!payerName || payerName.length > 100) {
      throw new InvalidContributionError('Enter a name of up to 100 characters.');
    }
    if (this.props.collectEmail && !EMAIL_PATTERN.test(input.email.trim())) {
      throw new InvalidContributionError('Enter a valid email address.');
    }
    if (this.props.customQuestion && !input.answer.trim()) {
      throw new InvalidContributionError('Answer the organiser’s question to continue.');
    }
    const status = input.method === 'instant' ? 'paid' : 'pending';
    const receipt = PaymentReceipt.create({
      id: input.receiptId,
      requestId: input.requestId,
      participantId: input.participantId,
      payerName,
      quantity: input.quantity,
      sourceAmount: Money.create(quote.sourceMinorUnits, quote.sourceCurrency),
      payAmount: Money.create(quote.payMinorUnits, quote.payCurrency),
      rate: quote.rate,
      method: input.method,
      status,
      answer: this.props.customQuestion ? input.answer.trim() : null,
      createdAt: input.now,
      paidAt: status === 'paid' ? input.now : null,
    });
    if (status === 'paid') {
      return { chipIn: this.withPaymentApplied(participant, quote.sourceMinorUnits, input.quantity), receipt };
    }
    const participants = participant
      ? this.props.participants.map((person) =>
          person.id === participant.id ? person.withStatus('pending') : person,
        )
      : this.props.participants;
    return { chipIn: new ChipIn({ ...this.props, participants }), receipt };
  }

  /** Confirms a pending bank-transfer receipt. Re-checks capacity: a pending transfer never reserved a spot. */
  confirmPendingPayment(
    receipt: PaymentReceipt,
    today: string,
    now: Date,
  ): { chipIn: ChipIn; receipt: PaymentReceipt } {
    if (receipt.status === 'paid') return { chipIn: this, receipt };
    const reason = this.closeReason(today);
    if (reason === 'spots' || reason === 'goal') throw new ChipInCapacityExceededError(reason);
    if (reason) throw new ChipInClosedError(reason);
    const remaining = this.remainingSpots();
    if (remaining !== null && receipt.quantity > remaining) {
      throw new ChipInCapacityExceededError(this.props.limitType === 'goal' ? 'goal' : 'spots');
    }
    const participant = receipt.participantId
      ? (this.props.participants.find((person) => person.id === receipt.participantId) ?? null)
      : null;
    return {
      chipIn: this.withPaymentApplied(participant, receipt.sourceAmount.minorUnits, receipt.quantity),
      receipt: receipt.markPaid(now),
    };
  }
}
