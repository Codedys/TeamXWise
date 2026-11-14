import { ChipIn } from '@/domain/entities/chip-in.entity';
import { Participant } from '@/domain/entities/participant.entity';
import { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import { Money } from '@/domain/value-objects/money.vo';
import { DomainError } from '@/domain/errors/domain-error';
import type {
  PublishChipInInputPort,
  PublishChipInRequest,
} from '@/application/ports/input/publish-chip-in.input-port';
import type { PublishChipInOutputPort } from '@/application/ports/output/publish-chip-in.output-port';
import { defaultDashboardPreferencesDto } from '@/application/ports/output/chip-in-dashboard.dto';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';
import { toChipInResponse } from './chip-in.mapper';

export class PublishChipInInteractor implements PublishChipInInputPort {
  constructor(
    private readonly repository: ChipInRepository,
    private readonly outputPort: PublishChipInOutputPort,
  ) {}

  async execute(request: PublishChipInRequest): Promise<void> {
    try {
      const chipIn = ChipIn.create({
        id: ChipInId.create(request.id),
        title: request.title,
        description: request.description,
        ownerName: request.ownerName,
        isOpen: true,
        invitationMessage: request.invitationMessage,
        audience: request.audience,
        price: Money.create(request.priceMinorUnits, request.currency),
        deadline: request.deadline,
        limitType: request.limitType,
        spotLimit: request.spotLimit,
        goal: Money.create(request.goalMinorUnits, request.currency),
        collectEmail: request.collectEmail,
        customQuestion: request.customQuestion,
        participants:
          request.audience === 'group'
            ? request.names.map((name) =>
                Participant.create({ id: crypto.randomUUID(), name, status: 'unpaid' }),
              )
            : [],
        progress: { paidSpots: 0, receivedMinorUnits: 0 },
        createdAt: request.createdAt,
      });
      await this.repository.save(chipIn, request.ownerToken, defaultDashboardPreferencesDto());
      this.outputPort.presentSuccess(toChipInResponse(chipIn));
    } catch (error) {
      if (error instanceof DomainError) {
        this.outputPort.presentError(error);
        return;
      }
      throw error;
    }
  }
}
