import type { ChipInResponse } from '@/application/ports/output/chip-in.dto';

export interface ChipInParticipantViewModel {
  id: string;
  name: string;
  status: 'unpaid' | 'pending' | 'paid';
}

/** What the payer/sharing screens render — shaped to match the UI's existing props exactly. */
export interface ChipInPreviewViewModel {
  id: string;
  title: string;
  description: string;
  ownerName: string;
  isOpen: boolean;
  invitationMessage: string | null;
  audience: 'group' | 'anyone';
  currency: 'EUR' | 'GBP' | 'USD';
  priceMinorUnits: number;
  deadline: string | null;
  limitType: 'none' | 'spots' | 'goal';
  spotLimit: number;
  goalMinorUnits: number;
  collectEmail: boolean;
  customQuestion: string | null;
  participants: ChipInParticipantViewModel[];
  progress: { paidSpots: number; receivedMinorUnits: number };
}

export function toChipInPreviewViewModel(response: ChipInResponse): ChipInPreviewViewModel {
  return {
    id: response.id,
    title: response.title,
    description: response.description,
    ownerName: response.ownerName,
    isOpen: response.isOpen,
    invitationMessage: response.invitationMessage,
    audience: response.audience,
    currency: response.currency as 'EUR' | 'GBP' | 'USD',
    priceMinorUnits: response.priceMinorUnits,
    deadline: response.deadline,
    limitType: response.limitType,
    spotLimit: response.spotLimit,
    goalMinorUnits: response.goalMinorUnits,
    collectEmail: response.collectEmail,
    customQuestion: response.customQuestion,
    participants: response.participants,
    progress: response.progress,
  };
}
