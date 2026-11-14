import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import { CollectionPayment } from '@/app/components/collection-payment/collection-payment';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
export const metadata: Metadata = {
  title: 'Chip in · Payer preview',
  description: 'Frontend demonstration of contributing to a collection.',
};
export default function PayerPreviewPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  return (
    <Suspense fallback={<main style={{ padding: 32 }}>Opening Chip in preview…</main>}>
      <PayerRoute params={params} />
    </Suspense>
  );
}
async function PayerRoute({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params;
  return <CollectionPayment collectionId={collectionId} className={inter.className} />;
}
