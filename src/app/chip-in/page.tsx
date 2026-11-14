import type { Metadata } from 'next';
import { ChipInIntro } from '@/app/components/chip-in-intro';

export const metadata: Metadata = {
  title: 'Chip in',
  description: 'Collect money from a group, without the chasing.',
};

export default function ChipInPage() {
  return <ChipInIntro />;
}