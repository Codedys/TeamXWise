export interface ActivateChipInDashboardRequest {
  id: string;
  ownerToken: string;
}

export interface ActivateChipInDashboardInputPort {
  execute(request: ActivateChipInDashboardRequest): Promise<void>;
}
