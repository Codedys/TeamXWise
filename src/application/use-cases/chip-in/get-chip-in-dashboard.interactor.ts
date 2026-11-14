import { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import type {
  GetChipInDashboardInputPort,
  GetChipInDashboardRequest,
} from '@/application/ports/input/get-chip-in-dashboard.input-port';
import type { GetChipInDashboardOutputPort } from '@/application/ports/output/get-chip-in-dashboard.output-port';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';
import { toChipInDashboardResponse } from './chip-in.mapper';

export class GetChipInDashboardInteractor implements GetChipInDashboardInputPort {
  constructor(
    private readonly repository: ChipInRepository,
    private readonly outputPort: GetChipInDashboardOutputPort,
  ) {}

  async execute(request: GetChipInDashboardRequest): Promise<void> {
    let id: ChipInId;
    try {
      id = ChipInId.create(request.id);
    } catch {
      this.outputPort.present(null);
      return;
    }
    const record = await this.repository.findDashboardById(id, request.ownerToken);
    this.outputPort.present(record && record.isActivated ? toChipInDashboardResponse(record) : null);
  }
}
