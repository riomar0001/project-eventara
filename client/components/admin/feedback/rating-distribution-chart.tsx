'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { FeedbackAnalytics } from '@/hooks/admin/feedback/use-feedback-analytics';

const chartConfig = {
  count: { label: 'Responses', color: 'oklch(0.648 0.2 131.684)' }
};

type Props = { analytics: FeedbackAnalytics | null; isLoading: boolean };

export function RatingDistributionChart({ analytics, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-1 h-3 w-44" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (analytics?.distribution ?? []).map((d) => ({
    label: d.label,
    count: d.count
  }));

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <p className="text-sm font-semibold">Rating Distribution</p>
        <p className="text-muted-foreground text-xs">Number of responses per star rating</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart data={chartData} barSize={32}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }} allowDecimals={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill={chartConfig.count.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
