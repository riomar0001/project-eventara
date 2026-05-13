'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { WeeklyRegistrationEntry } from '@/api/types.gen';

const CHART_COLOR = 'oklch(0.648 0.2 131.684)';

const chartConfig = {
  count: { label: 'New Users', color: CHART_COLOR }
};

function formatWeek(weekStart: string) {
  const [, month, day] = weekStart.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month, 10) - 1]} ${day}`;
}

type Props = { entries: WeeklyRegistrationEntry[]; isLoading: boolean };

export function UsersPerWeekChart({ entries, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-1 h-3 w-44" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = entries.map((e) => ({ week: formatWeek(e.week_start), count: e.count }));

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <p className="text-sm font-semibold">User Registrations</p>
        <p className="text-muted-foreground text-xs">New sign-ups per ISO week</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="users-week-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.2} />
                <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }}
              interval="preserveStartEnd"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="count" type="monotone" stroke={CHART_COLOR} strokeWidth={2} fill="url(#users-week-gradient)" dot={false} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
