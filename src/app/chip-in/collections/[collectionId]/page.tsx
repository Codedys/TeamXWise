import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import { CollectionDashboard } from '@/app/components/collection-dashboard/collection-dashboard';
const inter = Inter({ subsets: ['latin'], display: 'swap' });
export const metadata: Metadata = { title: 'Chip in · Collection dashboard' };
export default function CollectionDashboardPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  return (
    <Suspense fallback={<main style={{ padding: 32 }}>Opening your dashboard…</main>}>
      <DashboardRoute params={params} />
    </Suspense>
  );
}
async function DashboardRoute({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params;
  return <CollectionDashboard collectionId={collectionId} className={inter.className} />;
}
