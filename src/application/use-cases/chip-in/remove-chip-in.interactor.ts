import { DomainError } from '@/domain/errors/domain-error';
import { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import type {
  RemoveChipInInputPort,
  RemoveChipInRequest,
} from '@/application/ports/input/remove-chip-in.input-port';
import type { RemoveChipInOutputPort } from '@/application/ports/output/remove-chip-in.output-port';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';

export class RemoveChipInInteractor implements RemoveChipInInputPort {
  constructor(
    private readonly repository: ChipInRepository,
    private readonly outputPort: RemoveChipInOutputPort,
  ) {}

  async execute(request: RemoveChipInRequest): Promise<void> {
    try {
      await this.repository.remove(ChipInId.create(request.id), request.ownerToken);
      this.outputPort.presentSuccess();
    } catch (error) {
      if (error instanceof DomainError) {
        this.outputPort.presentError(error);
        return;
      }
      throw error;
    }
  }
}
