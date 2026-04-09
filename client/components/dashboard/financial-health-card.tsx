"use client"

import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChartContainer } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { financialHealthChartConfig as chartConfig, financialHealthData as data, financialHealthPercentage as percentage } from "@/constants/dashboard"

export function FinancialHealthCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <p className="text-sm font-semibold">Financial health</p>
          <p className="text-xs text-muted-foreground">Current status</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="xs" className="gap-1">
              30d <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>7d</DropdownMenuItem>
            <DropdownMenuItem>30d</DropdownMenuItem>
            <DropdownMenuItem>90d</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="mb-1 text-4xl font-bold">$15,780</p>
        <p className="mb-3 flex items-center gap-1 text-xs font-medium" style={{ color: "oklch(0.648 0.2 131.684)" }}>
          +17.5% from last month
        </p>

        {/* Donut chart */}
        <div className="relative flex items-center justify-center">
          <ChartContainer config={chartConfig} className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="80%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={55}
                  outerRadius={72}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill={chartConfig.filled.color} />
                  <Cell fill={chartConfig.empty.color} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="absolute bottom-4 flex flex-col items-center">
            <span className="text-2xl font-bold">75%</span>
            <span className="text-center text-[10px] text-muted-foreground leading-tight">Of monthly income saved</span>
          </div>
        </div>

        <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
          Based on aggregated transaction metrics over the past 30 days
        </p>
      </CardContent>
    </Card>
  )
}
