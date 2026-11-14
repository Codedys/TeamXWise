import type { DomainError } from '@/domain/errors/domain-error';
import type { RemoveChipInOutputPort } from '@/application/ports/output/remove-chip-in.output-port';

export type RemoveChipInViewModel = { status: 'success' } | { status: 'error'; message: string };

export class RemoveChipInPresenter implements RemoveChipInOutputPort {
  viewModel: RemoveChipInViewModel | null = null;

  presentSuccess(): void {
    this.viewModel = { status: 'success' };
  }

  presentError(error: DomainError): void {
    this.viewModel = { status: 'error', message: error.message };
  }
}
