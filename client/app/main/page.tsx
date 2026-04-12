'use client';

import { BalanceOverviewCard } from '@/components/dashboard/balance-overview-card';
import { BudgetTipCard } from '@/components/dashboard/budget-tip-card';
import { CostAnalysisCard } from '@/components/dashboard/cost-analysis-card';
import { FinancialHealthCard } from '@/components/dashboard/financial-health-card';
import { GoalTrackerCard } from '@/components/dashboard/goal-tracker-card';
import { MonthlySpendingCard } from '@/components/dashboard/monthly-spending-card';
import { StatsPanel } from '@/components/dashboard/stats-panel';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Balance overview + Stats */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <BalanceOverviewCard />
        <StatsPanel />
      </div>

      {/* Row 2: Spending limit + Budget tip */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MonthlySpendingCard />
        <BudgetTipCard />
      </div>

      {/* Row 3: Cost analysis + Financial health + Goal tracker */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CostAnalysisCard />
        <FinancialHealthCard />
        <GoalTrackerCard />
      </div>
    </div>
  );
}
