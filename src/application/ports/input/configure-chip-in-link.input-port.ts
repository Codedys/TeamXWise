export interface ConfigureChipInLinkRequest {
  id: string;
  ownerToken: string;
  isOpen: boolean;
  deadline: string | null;
  priceMinorUnits: number;
  limitType: 'none' | 'spots' | 'goal';
  spotLimit: number;
  goalMinorUnits: number;
  customQuestion: string | null;
  today: string;
}

export interface ConfigureChipInLinkInputPort {
  execute(request: ConfigureChipInLinkRequest): Promise<void>;
}
