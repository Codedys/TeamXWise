import type { ChipInDashboardResponse } from './chip-in-dashboard.dto';

export interface GetChipInDashboardOutputPort {
  present(dashboard: ChipInDashboardResponse | null): void;
}
