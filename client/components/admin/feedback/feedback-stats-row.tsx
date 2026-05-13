'use client';

import { MessageSquare, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { FeedbackAnalytics } from '@/hooks/admin/feedback/use-feedback-analytics';

type Props = { analytics: FeedbackAnalytics | null; isLoading: boolean };

export function FeedbackStatsRow({ analytics, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-5">
              <Skeleton className="size-11 shrink-0 rounded-2xl" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const avg = analytics?.averageRating ?? 0;
  const total = analytics?.total ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50">
            <Star className="size-5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground truncate text-xs">Average Rating</p>
            <p className="text-2xl font-bold tracking-tight">{avg > 0 ? avg.toFixed(1) : '—'}</p>
            <p className="text-muted-foreground truncate text-xs">Out of 5 stars</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50">
            <MessageSquare className="size-5 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground truncate text-xs">Total Feedback</p>
            <p className="text-2xl font-bold tracking-tight">{total.toLocaleString()}</p>
            <p className="text-muted-foreground truncate text-xs">All-time submissions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
