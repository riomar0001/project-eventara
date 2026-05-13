'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { EventSummaryResponse } from '@/api/types.gen';

const STATUS_STYLES: Record<string, string> = {
  ongoing: 'bg-green-50 text-green-700 border-green-200',
  upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-gray-50 text-gray-600 border-gray-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200'
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type Props = {
  title: string;
  subtitle: string;
  events: EventSummaryResponse[];
  isLoading: boolean;
};

export function EventsTableCard({ title, subtitle, events, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-1 h-3 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      </CardHeader>
      <CardContent>
        {events.length === 0 && <p className="text-muted-foreground text-sm">No events.</p>}
        <div className="divide-y">
          {events.map((event) => (
            <div key={event.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{event.title}</p>
                <p className="text-muted-foreground text-xs">{formatDate(event.start_date)}</p>
              </div>
              <Badge variant="outline" className={`shrink-0 capitalize ${STATUS_STYLES[event.status.toLowerCase()] ?? ''}`}>
                {event.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
