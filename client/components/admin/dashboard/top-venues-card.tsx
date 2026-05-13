'use client';

import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { VenueUsageResponse } from '@/api/types.gen';

type Props = {
  venues: VenueUsageResponse[];
  isLoading: boolean;
};

export function TopVenuesCard({ venues, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card className="w-full lg:w-72 shrink-0">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-1 h-3 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-7 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-6" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full lg:w-72 shrink-0">
      <CardHeader className="pb-2">
        <p className="text-sm font-semibold">Top Venues</p>
        <p className="text-muted-foreground text-xs">By number of event sessions</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {venues.length === 0 && <p className="text-muted-foreground text-sm">No venue data yet.</p>}
        {venues.slice(0, 5).map((venue, idx) => (
          <div key={venue.venue_id} className="flex items-center gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-600">
              {idx + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{venue.name}</p>
              {(venue.city ?? venue.province) && (
                <p className="text-muted-foreground flex items-center gap-0.5 truncate text-xs">
                  <MapPin className="size-3 shrink-0" />
                  {[venue.city, venue.province].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <span className="text-muted-foreground shrink-0 text-xs font-medium">{venue.event_session_count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
