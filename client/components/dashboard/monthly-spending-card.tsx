"use client"

import { Pencil } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export function MonthlySpendingCard() {
  const current = 8600
  const limit = 10000
  const percentage = Math.round((current / limit) * 100)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <p className="text-sm font-semibold">Monthly spending limit</p>
          <p className="text-xs text-muted-foreground">Recipient accounts</p>
        </div>
        <Button variant="ghost" size="icon-xs">
          <Pencil className="size-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className="h-3 rounded-full" />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>${current.toLocaleString()}</span>
          <span>${limit.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
