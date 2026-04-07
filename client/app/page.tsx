import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { BalanceOverviewCard } from "@/components/dashboard/balance-overview-card"
import { StatsPanel } from "@/components/dashboard/stats-panel"
import { MonthlySpendingCard } from "@/components/dashboard/monthly-spending-card"
import { BudgetTipCard } from "@/components/dashboard/budget-tip-card"
import { CostAnalysisCard } from "@/components/dashboard/cost-analysis-card"
import { FinancialHealthCard } from "@/components/dashboard/financial-health-card"
import { GoalTrackerCard } from "@/components/dashboard/goal-tracker-card"
import { CardPanel } from "@/components/my-card/card-panel"

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="flex flex-col overflow-hidden">
        <Header />

        <main className="flex flex-1 overflow-hidden">
          {/* Scrollable center content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex flex-col gap-4">
              {/* Row 1: Balance overview + Stats */}
              <div className="flex gap-4">
                <BalanceOverviewCard />
                <StatsPanel />
              </div>

              {/* Row 2: Spending limit + Budget tip */}
              <div className="grid grid-cols-2 gap-4">
                <MonthlySpendingCard />
                <BudgetTipCard />
              </div>

              {/* Row 3: Cost analysis + Financial health + Goal tracker */}
              <div className="grid grid-cols-3 gap-4">
                <CostAnalysisCard />
                <FinancialHealthCard />
                <GoalTrackerCard />
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-[22rem] shrink-0 overflow-y-auto border-l p-6">
            <CardPanel />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
