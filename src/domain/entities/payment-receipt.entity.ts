import type { Money } from '../value-objects/money.vo';

export type PaymentMethod = 'instant' | 'bank';
export type PaymentStatus = 'pending' | 'paid';

export interface PaymentReceiptProps {
  id: string;
  requestId: string;
  participantId: string | null;
  payerName: string;
  quantity: number;
  sourceAmount: Money;
  payAmount: Money;
  rate: number;
  method: PaymentMethod;
  status: PaymentStatus;
}

/** A single contribution attempt against a Chip-In — the unit the payer sees as a receipt. */
export class PaymentReceipt {
  private constructor(private readonly props: PaymentReceiptProps) {}

  static create(props: PaymentReceiptProps): PaymentReceipt {
    return new PaymentReceipt(props);
  }

  get id(): string {
    return this.props.id;
  }

  get requestId(): string {
    return this.props.requestId;
  }

  get participantId(): string | null {
    return this.props.participantId;
  }

  get payerName(): string {
    return this.props.payerName;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get sourceAmount(): Money {
    return this.props.sourceAmount;
  }

  get payAmount(): Money {
    return this.props.payAmount;
  }

  get rate(): number {
    return this.props.rate;
  }

  get method(): PaymentMethod {
    return this.props.method;
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  withStatus(status: PaymentStatus): PaymentReceipt {
    return new PaymentReceipt({ ...this.props, status });
  }
}
