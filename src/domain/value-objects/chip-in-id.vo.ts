import { InvalidChipInIdError } from '../errors/invalid-chip-in-id.error';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ChipInId {
  private constructor(private readonly value: string) {}

  static create(value: string): ChipInId {
    if (!UUID_PATTERN.test(value)) {
      throw new InvalidChipInIdError(value);
    }
    return new ChipInId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ChipInId): boolean {
    return this.value === other.value;
  }
}
