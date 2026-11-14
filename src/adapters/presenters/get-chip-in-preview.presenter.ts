import type { ChipInResponse } from '@/application/ports/output/chip-in.dto';
import type { GetChipInPreviewOutputPort } from '@/application/ports/output/get-chip-in-preview.output-port';
import { toChipInPreviewViewModel, type ChipInPreviewViewModel } from './chip-in-preview.view-model';

export type GetChipInPreviewViewModel = ChipInPreviewViewModel | null;

export class GetChipInPreviewPresenter implements GetChipInPreviewOutputPort {
  viewModel: GetChipInPreviewViewModel = null;

  present(chipIn: ChipInResponse | null): void {
    this.viewModel = chipIn ? toChipInPreviewViewModel(chipIn) : null;
  }
}
