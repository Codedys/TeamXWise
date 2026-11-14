export interface GetChipInDashboardRequest {
  id: string;
  ownerToken: string;
}

export interface GetChipInDashboardInputPort {
  execute(request: GetChipInDashboardRequest): Promise<void>;
}
