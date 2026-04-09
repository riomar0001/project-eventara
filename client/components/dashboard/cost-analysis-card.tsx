"use client"

import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { spendingCategories as categories } from "@/constants/dashboard"

export function CostAnalysisCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <p className="text-sm font-semibold">Cost analysis</p>
          <p className="text-xs text-muted-foreground">Spending overview</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="xs" className="gap-1">
              January <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["January", "February", "March"].map((m) => (
              <DropdownMenuItem key={m}>{m}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="mb-1 text-4xl font-bold">$8,450</p>

        {/* Segmented bar */}
        <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full">
          {categories.map((c) => (
            <div key={c.label} style={{ width: `${c.percent}%`, backgroundColor: c.color }} />
          ))}
        </div>

        {/* Category list */}
        <div className="flex flex-col gap-1.5">
          {categories.map((c) => (
            <div key={c.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <span className="text-xs font-medium">{c.percent}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
