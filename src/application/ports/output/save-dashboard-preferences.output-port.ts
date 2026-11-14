import type { DomainError } from '@/domain/errors/domain-error';
import type { ChipInDashboardResponse } from './chip-in-dashboard.dto';

export interface SaveDashboardPreferencesOutputPort {
  presentSuccess(response: ChipInDashboardResponse): void;
  presentError(error: DomainError): void;
}
