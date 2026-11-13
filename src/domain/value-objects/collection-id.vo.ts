import { InvalidCollectionIdError } from '../errors/invalid-collection-id.error';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CollectionId {
  private constructor(private readonly value: string) {}

  static create(value: string): CollectionId {
    if (!UUID_PATTERN.test(value)) {
      throw new InvalidCollectionIdError(value);
    }
    return new CollectionId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: CollectionId): boolean {
    return this.value === other.value;
  }
}
