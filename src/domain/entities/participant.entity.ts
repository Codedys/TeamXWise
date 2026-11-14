export type ParticipantStatus = 'unpaid' | 'pending' | 'paid';

export interface ParticipantProps {
  id: string;
  name: string;
  status: ParticipantStatus;
}

/** A named person in a group Chip-In — one of the organiser's provided names. */
export class Participant {
  private constructor(private readonly props: ParticipantProps) {}

  static create(props: ParticipantProps): Participant {
    return new Participant(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get status(): ParticipantStatus {
    return this.props.status;
  }

  withStatus(status: ParticipantStatus): Participant {
    return new Participant({ ...this.props, status });
  }
}
