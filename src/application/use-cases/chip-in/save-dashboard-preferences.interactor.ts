import { DomainError } from '@/domain/errors/domain-error';
import { ChipInId } from '@/domain/value-objects/chip-in-id.vo';
import type {
  SaveDashboardPreferencesInputPort,
  SaveDashboardPreferencesRequest,
} from '@/application/ports/input/save-dashboard-preferences.input-port';
import type { SaveDashboardPreferencesOutputPort } from '@/application/ports/output/save-dashboard-preferences.output-port';
import type { ChipInRepository } from '@/application/ports/repositories/chip-in.repository';
import { ChipInNotFoundError } from '@/domain/errors/chip-in-not-found.error';
import { toChipInDashboardResponse } from './chip-in.mapper';

export class SaveDashboardPreferencesInteractor implements SaveDashboardPreferencesInputPort {
  constructor(
    private readonly repository: ChipInRepository,
    private readonly outputPort: SaveDashboardPreferencesOutputPort,
  ) {}

  async execute(request: SaveDashboardPreferencesRequest): Promise<void> {
    try {
      const id = ChipInId.create(request.id);
      await this.repository.savePreferences(id, request.ownerToken, request.preferences);
      const record = await this.repository.findDashboardById(id, request.ownerToken);
      if (!record) throw new ChipInNotFoundError();
      this.outputPort.presentSuccess(toChipInDashboardResponse(record));
    } catch (error) {
      if (error instanceof DomainError) {
        this.outputPort.presentError(error);
        return;
      }
      throw error;
    }
  }
}
