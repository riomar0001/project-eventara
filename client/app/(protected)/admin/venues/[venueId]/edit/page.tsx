import { VenueForm } from '@/components/admin/venues/venue-form';
import { getVenueById } from '@/constants/event-management';
import { notFound } from 'next/navigation';

export default async function AdminVenueEditPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const venue = getVenueById(venueId);

  if (!venue) {
    notFound();
  }

  return <VenueForm mode="edit" venue={venue} />;
}
