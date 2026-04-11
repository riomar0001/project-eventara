'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const goals = [
  {
    label: 'Reserve',
    current: 7000,
    target: 10000,
    note: 'Left to save 4 months',
    color: 'oklch(0.648 0.2 131.684)'
  },
  {
    label: 'Travel',
    current: 2500,
    target: 4000,
    note: 'Left to save 3 months',
    color: 'oklch(0.879 0.169 91.605)'
  },
  {
    label: 'Car',
    current: 1600,
    target: 30000,
    note: 'Left to save 3 years 6 months',
    color: 'oklch(0.769 0.188 70.08)'
  },
  {
    label: 'Real estate',
    current: 8300,
    target: 10000,
    note: 'Left to save 5 years 8 months',
    color: 'oklch(0.769 0.188 70.08)'
  }
];

export function GoalTrackerCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <p className="text-sm font-semibold">Goal tracker</p>
        <Button variant="ghost" size="xs" className="gap-1">
          <Plus className="size-3" /> Add goals
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground -mt-2 text-xs">This year</p>
        {goals.slice(0, 2).map((goal) => (
          <GoalItem key={goal.label} goal={goal} />
        ))}
        <p className="text-muted-foreground text-xs">Long term</p>
        {goals.slice(2).map((goal) => (
          <GoalItem key={goal.label} goal={goal} />
        ))}
      </CardContent>
    </Card>
  );
}

function GoalItem({ goal }: { goal: (typeof goals)[0] }) {
  const pct = Math.round((goal.current / goal.target) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="bg-muted size-10 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium">{goal.label}</span>
          <span className="text-muted-foreground text-xs">
            ${goal.current.toLocaleString()}/${goal.target.toLocaleString()}
          </span>
        </div>
        <Progress value={pct} className="h-1.5" style={{ '--progress-color': goal.color } as React.CSSProperties} />
        <p className="text-muted-foreground mt-0.5 text-[10px]">{goal.note}</p>
      </div>
    </div>
  );
}
