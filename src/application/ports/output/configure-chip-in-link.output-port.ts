import type { DomainError } from '@/domain/errors/domain-error';
import type { ChipInResponse } from './chip-in.dto';

export interface ConfigureChipInLinkOutputPort {
  presentSuccess(response: ChipInResponse): void;
  presentError(error: DomainError): void;
}
