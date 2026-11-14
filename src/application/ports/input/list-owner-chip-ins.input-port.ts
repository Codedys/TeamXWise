export interface ListOwnerChipInsRequest {
  ownerToken: string;
}

export interface ListOwnerChipInsInputPort {
  execute(request: ListOwnerChipInsRequest): Promise<void>;
}
