import { InvalidCollectionTitleError } from '../errors/invalid-collection-title.error';
import { CollectionId } from '../value-objects/collection-id.vo';
import { Money } from '../value-objects/money.vo';

const MAX_TITLE_LENGTH = 120;

export interface CollectionProps {
  id: CollectionId;
  title: string;
  targetAmount: Money;
  createdAt: Date;
}

/** A group payment pot that an organiser shares via a single link. */
export class Collection {
  private constructor(
    private readonly id_: CollectionId,
    private readonly title_: string,
    private readonly targetAmount_: Money,
    private readonly createdAt_: Date,
  ) {}

  static create(props: CollectionProps): Collection {
    const title = props.title.trim();
    if (title.length === 0) {
      throw new InvalidCollectionTitleError('title cannot be empty');
    }
    if (title.length > MAX_TITLE_LENGTH) {
      throw new InvalidCollectionTitleError(
        `title cannot exceed ${MAX_TITLE_LENGTH} characters`,
      );
    }
    return new Collection(props.id, title, props.targetAmount, props.createdAt);
  }

  get id(): CollectionId {
    return this.id_;
  }

  get title(): string {
    return this.title_;
  }

  get targetAmount(): Money {
    return this.targetAmount_;
  }

  get createdAt(): Date {
    return this.createdAt_;
  }
}
