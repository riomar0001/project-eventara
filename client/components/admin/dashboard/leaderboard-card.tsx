'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type LeaderboardEntry = {
  id: string;
  fullName?: string | null;
  alias?: string | null;
  profilePictureUrl?: string | null;
  sublabel?: string | null;
  count: number;
};

type Props = {
  title: string;
  subtitle: string;
  entries: LeaderboardEntry[];
  countLabel: string;
  isLoading: boolean;
};

function getInitials(name?: string | null, alias?: string | null) {
  const source = name ?? alias ?? '?';
  return source
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function LeaderboardCard({ title, subtitle, entries, countLabel, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-1 h-3 w-44" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
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
      <CardContent className="space-y-3">
        {entries.length === 0 && <p className="text-muted-foreground text-sm">No data yet.</p>}
        {entries.map((entry, idx) => {
          const displayName = entry.fullName ?? entry.alias ?? 'Unknown';
          return (
            <div key={entry.id} className="flex items-center gap-3">
              <span className="text-muted-foreground w-4 shrink-0 text-center text-xs font-medium">{idx + 1}</span>
              <Avatar className="size-8 shrink-0">
                <AvatarImage src={entry.profilePictureUrl ?? undefined} alt={displayName} />
                <AvatarFallback className="text-xs">{getInitials(entry.fullName, entry.alias)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName}</p>
                {entry.sublabel && <p className="text-muted-foreground truncate text-xs">{entry.sublabel}</p>}
              </div>
              <span className="text-muted-foreground shrink-0 text-xs">
                {entry.count} {countLabel}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
