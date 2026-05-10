import { notFound } from 'next/navigation';

export default async function AdminVolunteerEditPage({ params }: { params: Promise<{ volunteerId: string }> }) {
  await params;
  notFound();
}
