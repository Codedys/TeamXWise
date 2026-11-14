import type { ChipInDashboardResponse } from '@/application/ports/output/chip-in-dashboard.dto';
import type { GetChipInDashboardOutputPort } from '@/application/ports/output/get-chip-in-dashboard.output-port';
import {
  toChipInDashboardViewModel,
  type ChipInDashboardViewModel,
} from './chip-in-dashboard.view-model';

export type GetChipInDashboardViewModel = ChipInDashboardViewModel | null;

export class GetChipInDashboardPresenter implements GetChipInDashboardOutputPort {
  viewModel: GetChipInDashboardViewModel = null;

  present(dashboard: ChipInDashboardResponse | null): void {
    this.viewModel = dashboard ? toChipInDashboardViewModel(dashboard) : null;
  }
}
