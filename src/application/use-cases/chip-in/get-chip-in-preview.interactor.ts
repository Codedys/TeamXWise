import { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import type {
  GetChipInPreviewInputPort,
  GetChipInPreviewRequest,
} from '@/application/ports/input/get-chip-in-preview.input-port';
import type { GetChipInPreviewOutputPort } from '@/application/ports/output/get-chip-in-preview.output-port';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';
import { toChipInResponse } from './chip-in.mapper';

export class GetChipInPreviewInteractor implements GetChipInPreviewInputPort {
  constructor(
    private readonly repository: ChipInRepository,
    private readonly outputPort: GetChipInPreviewOutputPort,
  ) {}

  async execute(request: GetChipInPreviewRequest): Promise<void> {
    let id: ChipInId;
    try {
      id = ChipInId.create(request.id);
    } catch {
      this.outputPort.present(null);
      return;
    }
    const chipIn = await this.repository.findById(id);
    this.outputPort.present(chipIn ? toChipInResponse(chipIn) : null);
  }
}
