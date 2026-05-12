'use client';

import { use } from 'react';
import { VenueForm } from '@/components/admin/venues/venue-form';
import { BackLink } from '@/components/admin/venues/venues-shared';
import { PermissionGate } from '@/components/auth/permission-gate';
import { useVenue } from '@/hooks/admin/venues/use-venue';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

function VenueEditContent({ venueId }: { venueId: string }) {
  const { venue, isLoading, error } = useVenue(venueId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-neutral-100" />
        <div className="h-96 animate-pulse rounded-[24px] bg-neutral-100" />
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="space-y-4">
        <BackLink href={ADMIN_OPERATIONS_PATHS.venues} label="Back to venues" />
        <div className="rounded-[24px] border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-red-700">{error ?? 'Venue not found.'}</p>
        </div>
      </div>
    );
  }

  return <VenueForm mode="edit" venue={venue} />;
}

export default function AdminVenueEditPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = use(params);
  return (
    <PermissionGate feature="venues" action="update">
      <VenueEditContent venueId={venueId} />
    </PermissionGate>
  );
}
