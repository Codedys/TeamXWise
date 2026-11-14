export interface RemoveChipInRequest {
  id: string;
  ownerToken: string;
}

export interface RemoveChipInInputPort {
  execute(request: RemoveChipInRequest): Promise<void>;
}
