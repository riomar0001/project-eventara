import { VolunteerProfile } from '@/components/admin/volunteers/volunteer-profile';

export default async function AdminVolunteerProfilePage({ params }: { params: Promise<{ volunteerId: string }> }) {
  const { volunteerId } = await params;

  return <VolunteerProfile volunteerId={volunteerId} />;
}
