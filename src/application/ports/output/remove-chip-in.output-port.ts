import type { DomainError } from '@/domain/errors/domain-error';

export interface RemoveChipInOutputPort {
  presentSuccess(): void;
  presentError(error: DomainError): void;
}
