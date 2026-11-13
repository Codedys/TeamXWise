import 'server-only';

import type { ListCollectionsInputPort } from '@/application/ports/input/list-collections.input-port';
import type { ListCollectionsViewModel } from '@/adapters/presenters/list-collections.presenter';

export class ListCollectionsController {
  constructor(
    private readonly inputPort: ListCollectionsInputPort,
    private readonly presenter: { viewModel: ListCollectionsViewModel | null },
  ) {}

  async handle(): Promise<ListCollectionsViewModel> {
    await this.inputPort.execute({});
    return this.presenter.viewModel ?? [];
  }
}
