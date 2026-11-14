import type {
  ListOwnerChipInsInputPort,
  ListOwnerChipInsRequest,
} from '@/application/ports/input/list-owner-chip-ins.input-port';
import type { ListOwnerChipInsOutputPort } from '@/application/ports/output/list-owner-chip-ins.output-port';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';
import { toChipInDashboardResponse } from './chip-in.mapper';

export class ListOwnerChipInsInteractor implements ListOwnerChipInsInputPort {
  constructor(
    private readonly repository: ChipInRepository,
    private readonly outputPort: ListOwnerChipInsOutputPort,
  ) {}

  async execute(request: ListOwnerChipInsRequest): Promise<void> {
    const records = await this.repository.findManyActivatedByOwnerToken(request.ownerToken);
    this.outputPort.present(records.map(toChipInDashboardResponse));
  }
}
