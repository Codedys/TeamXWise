import { DomainError } from '@/domain/errors/domain-error';
import { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import type {
  ActivateChipInDashboardInputPort,
  ActivateChipInDashboardRequest,
} from '@/application/ports/input/activate-chip-in-dashboard.input-port';
import type { ActivateChipInDashboardOutputPort } from '@/application/ports/output/activate-chip-in-dashboard.output-port';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';

export class ActivateChipInDashboardInteractor implements ActivateChipInDashboardInputPort {
  constructor(
    private readonly repository: ChipInRepository,
    private readonly outputPort: ActivateChipInDashboardOutputPort,
  ) {}

  async execute(request: ActivateChipInDashboardRequest): Promise<void> {
    try {
      await this.repository.activate(ChipInId.create(request.id), request.ownerToken);
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
