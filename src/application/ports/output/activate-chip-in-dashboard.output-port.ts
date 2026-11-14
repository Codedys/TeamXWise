import type { DomainError } from '@/domain/errors/domain-error';

export interface ActivateChipInDashboardOutputPort {
  presentSuccess(): void;
  presentError(error: DomainError): void;
}
