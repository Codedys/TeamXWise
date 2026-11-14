import type { ChipInResponse } from './chip-in.dto';

export interface GetChipInPreviewOutputPort {
  present(chipIn: ChipInResponse | null): void;
}
