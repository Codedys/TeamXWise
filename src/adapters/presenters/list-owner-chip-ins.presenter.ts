import type { ChipInDashboardResponse } from '@/application/ports/output/chip-in-dashboard.dto';
import type { ListOwnerChipInsOutputPort } from '@/application/ports/output/list-owner-chip-ins.output-port';
import {
  toChipInDashboardViewModel,
  type ChipInDashboardViewModel,
} from './chip-in-dashboard.view-model';

export type ListOwnerChipInsViewModel = ChipInDashboardViewModel[];

export class ListOwnerChipInsPresenter implements ListOwnerChipInsOutputPort {
  viewModel: ListOwnerChipInsViewModel = [];

  present(dashboards: ChipInDashboardResponse[]): void {
    this.viewModel = dashboards.map(toChipInDashboardViewModel);
  }
}
