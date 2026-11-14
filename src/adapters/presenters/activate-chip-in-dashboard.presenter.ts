import type { DomainError } from '@/domain/errors/domain-error';
import type { ActivateChipInDashboardOutputPort } from '@/application/ports/output/activate-chip-in-dashboard.output-port';

export type ActivateChipInDashboardViewModel =
  | { status: 'success' }
  | { status: 'error'; message: string };

export class ActivateChipInDashboardPresenter implements ActivateChipInDashboardOutputPort {
  viewModel: ActivateChipInDashboardViewModel | null = null;

  presentSuccess(): void {
    this.viewModel = { status: 'success' };
  }

  presentError(error: DomainError): void {
    this.viewModel = { status: 'error', message: error.message };
  }
}
