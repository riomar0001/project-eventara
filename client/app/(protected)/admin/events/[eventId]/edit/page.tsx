import { notFound } from 'next/navigation';

export default async function AdminEventEditPage({ params }: { params: Promise<{ eventId: string }> }) {
  await params;
  notFound();
}
