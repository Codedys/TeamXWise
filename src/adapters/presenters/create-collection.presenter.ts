import type { DomainError } from '@/domain/errors/domain-error';
import type {
  CreateCollectionOutputPort,
  CreateCollectionResponse,
} from '@/application/ports/output/create-collection.output-port';

export type CreateCollectionViewModel =
  | {
      status: 'success';
      collection: {
        id: string;
        title: string;
        formattedAmount: string;
      };
    }
  | { status: 'error'; message: string };

function formatAmount(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
    minorUnits / 100,
  );
}

export class CreateCollectionPresenter implements CreateCollectionOutputPort {
  viewModel: CreateCollectionViewModel | null = null;

  presentSuccess(response: CreateCollectionResponse): void {
    this.viewModel = {
      status: 'success',
      collection: {
        id: response.id,
        title: response.title,
        formattedAmount: formatAmount(response.targetAmountMinorUnits, response.currency),
      },
    };
  }

  presentError(error: DomainError): void {
    this.viewModel = { status: 'error', message: error.message };
  }
}
