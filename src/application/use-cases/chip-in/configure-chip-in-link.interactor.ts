import { DomainError } from '@/domain/errors/domain-error';
import { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import { Money } from '@/domain/value-objects/money.vo';
import { ChipInNotFoundError } from '@/domain/errors/chip-in-not-found.error';
import type {
  ConfigureChipInLinkInputPort,
  ConfigureChipInLinkRequest,
} from '@/application/ports/input/configure-chip-in-link.input-port';
import type { ConfigureChipInLinkOutputPort } from '@/application/ports/output/configure-chip-in-link.output-port';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';
import { toChipInResponse } from './chip-in.mapper';

export class ConfigureChipInLinkInteractor implements ConfigureChipInLinkInputPort {
  constructor(
    private readonly repository: ChipInRepository,
    private readonly outputPort: ConfigureChipInLinkOutputPort,
  ) {}

  async execute(request: ConfigureChipInLinkRequest): Promise<void> {
    try {
      const id = ChipInId.create(request.id);
      const record = await this.repository.findDashboardById(id, request.ownerToken);
      if (!record) throw new ChipInNotFoundError();
      const reconfigured = record.chipIn.reconfigure({
        isOpen: request.isOpen,
        deadline: request.deadline,
        price: Money.create(request.priceMinorUnits, record.chipIn.price.currency),
        limitType: request.limitType,
        spotLimit: request.spotLimit,
        goal: Money.create(request.goalMinorUnits, record.chipIn.price.currency),
        customQuestion: request.customQuestion,
        today: request.today,
      });
      await this.repository.updateSettings(reconfigured, request.ownerToken);
      this.outputPort.presentSuccess(toChipInResponse(reconfigured));
    } catch (error) {
      if (error instanceof DomainError) {
        this.outputPort.presentError(error);
        return;
      }
      throw error;
    }
  }
}
