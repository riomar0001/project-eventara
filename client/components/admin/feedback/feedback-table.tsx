'use client';

import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AppFeedbackRecordResponse } from '@/api/types.gen';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type Props = {
  feedback: AppFeedbackRecordResponse[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
};

export function FeedbackTable({ feedback, total, page, totalPages, pageSize, isLoading, onPageChange }: Props) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-sm font-semibold">All Feedback</p>
        <p className="text-muted-foreground text-xs">{isLoading ? 'Loading…' : `Showing ${from}–${to} of ${total}`}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <Skeleton className="mt-0.5 h-4 w-20 shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-20 shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {feedback.length === 0 && <p className="text-muted-foreground py-4 text-sm">No feedback submitted yet.</p>}
            {feedback.map((item) => (
              <div key={item.id} className="flex items-start gap-4 py-3">
                <StarRating rating={item.rating} />
                <p className="text-muted-foreground min-w-0 flex-1 truncate text-sm">{item.comment ?? <span className="italic">No comment</span>}</p>
                <span className="text-muted-foreground shrink-0 text-xs">{formatDate(item.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => onPageChange(page - 1)}>
              Previous
            </Button>
            <span className="text-muted-foreground text-xs">
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages || isLoading} onClick={() => onPageChange(page + 1)}>
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
