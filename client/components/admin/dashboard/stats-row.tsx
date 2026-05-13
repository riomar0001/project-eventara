'use client';

import { Calendar, Play, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardMetricsResponse } from '@/api/types.gen';

type Stat = {
  label: string;
  value: string | number;
  sublabel: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
};

function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${stat.iconBg}`}>
          <Icon className={`size-5 ${stat.iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-xs">{stat.label}</p>
          <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
          <p className="text-muted-foreground truncate text-xs">{stat.sublabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <Skeleton className="size-11 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

type Props = { metrics: DashboardMetricsResponse | null; isLoading: boolean };

export function DashboardStatsRow({ metrics, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const usersThisWeek = metrics?.users_per_week?.at(-1)?.count ?? 0;

  const stats: Stat[] = [
    {
      label: 'Ongoing Events',
      value: metrics?.ongoing_events.length ?? 0,
      sublabel: 'Currently in progress',
      icon: Play,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      label: 'Upcoming Events',
      value: metrics?.upcoming_events.length ?? 0,
      sublabel: 'Next 5 posted events',
      icon: Clock,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Recent Events',
      value: metrics?.recent_events.length ?? 0,
      sublabel: 'Last 10 created',
      icon: Calendar,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600'
    },
    {
      label: 'New Users This Week',
      value: usersThisWeek,
      sublabel: 'Registered current ISO week',
      icon: Users,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
