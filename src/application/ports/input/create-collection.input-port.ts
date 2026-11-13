/** Request DTO — built by the controller, never a raw HTTP/form payload. */
export interface CreateCollectionRequest {
  id: string;
  title: string;
  targetAmountMinorUnits: number;
  currency: string;
  createdAt: Date;
}

export interface CreateCollectionInputPort {
  execute(request: CreateCollectionRequest): Promise<void>;
}
