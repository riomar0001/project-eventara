'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Footer } from '@/components/footer/footer';
import { Navbar } from '@/components/navigation/navbar';
import { ContributeVenueForm } from '@/components/venue-hub/contribute-venue-form';
import { useAuthStore } from '@/store/auth-store';
import { Venues } from '@/api';
import type { PublicVenueRecordResponse } from '@/api/types.gen';

export default function EditVenuePage() {
  const params = useParams<{ venueId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [venue, setVenue] = useState<PublicVenueRecordResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.venueId) return;
    Venues.getCommunityVenueVenuesPublicCommunityVenueIdGet({
      path: { venue_id: params.venueId },
    }).then(({ data, error: fetchError }) => {
      if (fetchError || !data?.data) {
        setError('Venue not found.');
      } else {
        setVenue(data.data);
      }
      setLoading(false);
    });
  }, [params.venueId]);

  return (
    <div className="bg-page relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 top-0 z-0 h-[480px] overflow-hidden">
        <div className="absolute top-[-200px] left-[-160px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,oklch(0.9_0.22_128_/_0.3),transparent_65%)] blur-[90px]" />
        <div className="absolute inset-0 bg-[linear-gradient(var(--line-soft)_1px,transparent_1px),linear-gradient(90deg,var(--line-soft)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_30%,transparent_75%)] bg-[length:64px_64px] opacity-25" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 size={24} className="text-text-mute animate-spin" />
          </div>
        ) : error || !venue ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="text-text text-base font-semibold">{error ?? 'Venue not found.'}</p>
            <button
              onClick={() => router.push('/venues')}
              className="text-text-mute hover:text-text font-mono text-sm transition-colors"
            >
              Back to venues
            </button>
          </div>
        ) : (
          <ContributeVenueForm
            venueId={params.venueId}
            existingVenue={{
              name: venue.name,
              description: venue.description,
              address_line: venue.address_line,
              city: venue.city,
              province: venue.province,
              postal_code: venue.postal_code,
              region: venue.region,
              country: venue.country,
              capacity: venue.capacity,
              venue_type: venue.venue_type as 'indoor' | 'outdoor' | 'hybrid',
              amenities: venue.amenities,
              image_url: venue.image_url ?? null,
            }}
          />
        )}

        <Footer />
      </div>
    </div>
  );
}
