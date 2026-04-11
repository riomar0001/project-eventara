'use client';

import { BarChart2, LineChart as LineChartIcon, ChevronDown } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const chartData = [
  { day: 'Sun', savings: 8, income: 12, expenses: 4 },
  { day: 'Mon', savings: 10, income: 15, expenses: 5 },
  { day: 'Tue', savings: 12, income: 18, expenses: 8 },
  { day: 'Wed', savings: 24, income: 70, expenses: 46 },
  { day: 'Thu', savings: 9, income: 14, expenses: 6 },
  { day: 'Fri', savings: 7, income: 11, expenses: 5 },
  { day: 'Sat', savings: 6, income: 10, expenses: 3 }
];

const chartConfig = {
  savings: { label: 'Savings', color: 'oklch(0.879 0.169 91.605)' },
  income: { label: 'Income', color: 'oklch(0.648 0.2 131.684)' },
  expenses: { label: 'Expenses', color: 'oklch(0.769 0.188 70.08)' }
};

export function BalanceOverviewCard() {
  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <p className="text-5xl font-bold tracking-tight">$12,450</p>
          <p className="text-muted-foreground text-xs">Balance overview</p>
        </div>
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="xs" className="gap-1">
                7d <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>7d</DropdownMenuItem>
              <DropdownMenuItem>30d</DropdownMenuItem>
              <DropdownMenuItem>90d</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon-xs">
            <BarChart2 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-xs">
            <LineChartIcon className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-3 flex items-center gap-4">
          {Object.entries(chartConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: cfg.color }} />
              <span className="text-muted-foreground text-xs">{cfg.label}</span>
            </div>
          ))}
        </div>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="savings-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartConfig.savings.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartConfig.savings.color} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="income-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartConfig.income.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartConfig.income.color} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenses-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartConfig.expenses.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartConfig.expenses.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="savings" type="monotone" stroke={chartConfig.savings.color} strokeWidth={2} fill="url(#savings-gradient)" dot={false} />
            <Area dataKey="income" type="monotone" stroke={chartConfig.income.color} strokeWidth={2} fill="url(#income-gradient)" dot={false} />
            <Area dataKey="expenses" type="monotone" stroke={chartConfig.expenses.color} strokeWidth={2} fill="url(#expenses-gradient)" dot={false} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
