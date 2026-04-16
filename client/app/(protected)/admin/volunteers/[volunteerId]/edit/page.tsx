import { notFound } from 'next/navigation';
import { VolunteerForm } from '@/components/admin/volunteers/volunteer-form';
import { getVolunteerById } from '@/constants/event-management';

export default async function AdminVolunteerEditPage({ params }: { params: Promise<{ volunteerId: string }> }) {
  const { volunteerId } = await params;
  const volunteer = getVolunteerById(volunteerId);

  if (!volunteer) {
    notFound();
  }

  return <VolunteerForm mode="edit" volunteer={volunteer} />;
}
