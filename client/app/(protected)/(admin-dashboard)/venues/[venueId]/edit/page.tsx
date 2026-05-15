'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { VenueForm } from '@/components/admin/venues/venue-form';
import { BackLink } from '@/components/admin/venues/venues-shared';
import { useVenue } from '@/hooks/admin/venues/use-venue';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { usePermissions } from '@/context/permissions-context';
import { useAuthStore } from '@/store/auth-store';

function VenueEditContent({ venueId }: { venueId: string }) {
  const { venue, isLoading, error } = useVenue(venueId);
  const { can } = usePermissions();
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

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

  const canUpdateVenue = can('venues', 'update');
  const canUpdateOwnSuggestion = !venue.is_partner && venue.creator_id === currentUserId;

  if (!canUpdateVenue && !canUpdateOwnSuggestion) notFound();

  return <VenueForm mode="edit" venue={venue} suggestedVenue={!canUpdateVenue && canUpdateOwnSuggestion} />;
}

export default function AdminVenueEditPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = use(params);
  return <VenueEditContent venueId={venueId} />;
}
