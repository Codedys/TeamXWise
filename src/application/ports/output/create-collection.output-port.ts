import type { DomainError } from '@/domain/errors/domain-error';

/** Response DTO — plain data, no entities or value objects leak past this boundary. */
export interface CreateCollectionResponse {
  id: string;
  title: string;
  targetAmountMinorUnits: number;
  currency: string;
  createdAt: Date;
}

export interface CreateCollectionOutputPort {
  presentSuccess(response: CreateCollectionResponse): void;
  presentError(error: DomainError): void;
}
