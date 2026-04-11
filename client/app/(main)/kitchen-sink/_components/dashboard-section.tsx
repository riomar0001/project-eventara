import { BalanceOverviewCard } from '@/components/dashboard/balance-overview-card';
import { BudgetTipCard } from '@/components/dashboard/budget-tip-card';
import { CostAnalysisCard } from '@/components/dashboard/cost-analysis-card';
import { FinancialHealthCard } from '@/components/dashboard/financial-health-card';
import { GoalTrackerCard } from '@/components/dashboard/goal-tracker-card';
import { MonthlySpendingCard } from '@/components/dashboard/monthly-spending-card';
import { StatsPanel } from '@/components/dashboard/stats-panel';
import { Section } from './shared';

export function DashboardSection() {
  return (
    <Section title="Dashboard Cards">
      <div className="flex flex-col gap-4 lg:flex-row">
        <BalanceOverviewCard />
        <StatsPanel />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MonthlySpendingCard />
        <BudgetTipCard />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CostAnalysisCard />
        <FinancialHealthCard />
        <GoalTrackerCard />
      </div>
    </Section>
  );
}
