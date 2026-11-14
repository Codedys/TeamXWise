import type { DashboardPreferencesDto } from '@/application/ports/output/chip-in-dashboard.dto';

export interface SaveDashboardPreferencesRequest {
  id: string;
  ownerToken: string;
  preferences: DashboardPreferencesDto;
}

export interface SaveDashboardPreferencesInputPort {
  execute(request: SaveDashboardPreferencesRequest): Promise<void>;
}
