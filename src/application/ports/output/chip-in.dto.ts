/** Shared response shape — a chip-in as the payer/sharing screens need to see it. */
export interface ChipInParticipantDto {
  id: string;
  name: string;
  status: 'unpaid' | 'pending' | 'paid';
}

export interface ChipInResponse {
  id: string;
  title: string;
  description: string;
  ownerName: string;
  isOpen: boolean;
  invitationMessage: string | null;
  audience: 'group' | 'anyone';
  priceMinorUnits: number;
  currency: string;
  deadline: string | null;
  limitType: 'none' | 'spots' | 'goal';
  spotLimit: number;
  goalMinorUnits: number;
  collectEmail: boolean;
  customQuestion: string | null;
  participants: ChipInParticipantDto[];
  progress: { paidSpots: number; receivedMinorUnits: number };
}
