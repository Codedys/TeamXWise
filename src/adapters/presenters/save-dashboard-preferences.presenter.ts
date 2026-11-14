import type { DomainError } from '@/domain/errors/domain-error';
import type { ChipInDashboardResponse } from '@/application/ports/output/chip-in-dashboard.dto';
import type { SaveDashboardPreferencesOutputPort } from '@/application/ports/output/save-dashboard-preferences.output-port';
import {
  toChipInDashboardViewModel,
  type ChipInDashboardViewModel,
} from './chip-in-dashboard.view-model';

export type SaveDashboardPreferencesViewModel =
  | { status: 'success'; dashboard: ChipInDashboardViewModel }
  | { status: 'error'; message: string };

export class SaveDashboardPreferencesPresenter implements SaveDashboardPreferencesOutputPort {
  viewModel: SaveDashboardPreferencesViewModel | null = null;

  presentSuccess(response: ChipInDashboardResponse): void {
    this.viewModel = { status: 'success', dashboard: toChipInDashboardViewModel(response) };
  }

  presentError(error: DomainError): void {
    this.viewModel = { status: 'error', message: error.message };
  }
}
