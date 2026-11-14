import type { DomainError } from '@/domain/errors/domain-error';
import type { ChipInResponse } from '@/application/ports/output/chip-in.dto';
import type { ConfigureChipInLinkOutputPort } from '@/application/ports/output/configure-chip-in-link.output-port';
import { toChipInPreviewViewModel, type ChipInPreviewViewModel } from './chip-in-preview.view-model';

export type ConfigureChipInLinkViewModel =
  | { status: 'success'; chipIn: ChipInPreviewViewModel }
  | { status: 'error'; message: string };

export class ConfigureChipInLinkPresenter implements ConfigureChipInLinkOutputPort {
  viewModel: ConfigureChipInLinkViewModel | null = null;

  presentSuccess(response: ChipInResponse): void {
    this.viewModel = { status: 'success', chipIn: toChipInPreviewViewModel(response) };
  }

  presentError(error: DomainError): void {
    this.viewModel = { status: 'error', message: error.message };
  }
}
