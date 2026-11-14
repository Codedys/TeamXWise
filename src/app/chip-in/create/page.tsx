import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CreateCollectionWizard } from '@/app/components/create-collection/create-collection-wizard';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Create a collection · Chip in',
  description: 'Set up a group collection. Frontend preview.',
};

export default function CreateCollectionPage() {
  return <CreateCollectionWizard className={inter.className} />;
}
