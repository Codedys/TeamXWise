import type { DomainError } from '@/domain/errors/domain-error';
import type { ChipInResponse } from '@/application/ports/output/chip-in.dto';
import type { PublishChipInOutputPort } from '@/application/ports/output/publish-chip-in.output-port';
import { toChipInPreviewViewModel, type ChipInPreviewViewModel } from './chip-in-preview.view-model';

export type PublishChipInViewModel =
  | { status: 'success'; chipIn: ChipInPreviewViewModel }
  | { status: 'error'; message: string };

export class PublishChipInPresenter implements PublishChipInOutputPort {
  viewModel: PublishChipInViewModel | null = null;

  presentSuccess(response: ChipInResponse): void {
    this.viewModel = { status: 'success', chipIn: toChipInPreviewViewModel(response) };
  }

  presentError(error: DomainError): void {
    this.viewModel = { status: 'error', message: error.message };
  }
}
