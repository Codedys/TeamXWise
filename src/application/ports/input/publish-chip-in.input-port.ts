export interface PublishChipInRequest {
  id: string;
  title: string;
  description: string;
  ownerName: string;
  ownerToken: string;
  audience: 'group' | 'anyone';
  priceMinorUnits: number;
  currency: string;
  deadline: string | null;
  limitType: 'none' | 'spots' | 'goal';
  spotLimit: number;
  goalMinorUnits: number;
  collectEmail: boolean;
  customQuestion: string | null;
  invitationMessage: string | null;
  names: string[];
  createdAt: Date;
}

export interface PublishChipInInputPort {
  execute(request: PublishChipInRequest): Promise<void>;
}
