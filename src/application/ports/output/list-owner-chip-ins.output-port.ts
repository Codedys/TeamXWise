import type { ChipInDashboardResponse } from './chip-in-dashboard.dto';

export interface ListOwnerChipInsOutputPort {
  present(dashboards: ChipInDashboardResponse[]): void;
}
