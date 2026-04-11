import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const stats = [
  { label: 'Total income', value: '$15,000', trend: '+5.1% from last month', positive: true },
  { label: 'Total expences', value: '$6,700', trend: '+13.5% from last month', positive: false },
  { label: 'Saved balance', value: '$8,300', trend: '+20.7% from last month', positive: true }
];

export function StatsPanel() {
  return (
    <Card className="w-66 shrink-0">
      <CardContent className="flex h-full flex-col divide-y p-0">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 px-4 py-4">
            <p className="text-muted-foreground text-xs">{stat.label}</p>
            <p className="text-4xl font-bold tracking-tight">{stat.value}</p>
            <div
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: stat.positive ? 'oklch(0.648 0.2 131.684)' : 'oklch(0.577 0.245 27.325)' }}
            >
              <TrendingUp className="size-3" />
              <span>{stat.trend}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
