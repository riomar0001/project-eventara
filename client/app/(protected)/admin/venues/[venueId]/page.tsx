import { VenueDetail } from '@/components/admin/venues/venue-detail';

export default async function AdminVenueDetailPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;

  return <VenueDetail venueId={venueId} />;
}
