import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function BudgetTipCard() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <p className="text-sm font-semibold leading-snug">Optimize your budget with these quick tips</p>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
          Start preparing for the 2025 tax season by saving 10–15% for deductions.
        </p>
        <Button variant="ghost" size="sm" className="gap-1 p-0 text-xs font-medium hover:bg-transparent">
          Read more <ArrowRight className="size-3" />
        </Button>
      </CardContent>

      {/* Decorative blocks */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 grid grid-cols-2 gap-1 opacity-80">
        <div className="size-7 rounded-md bg-primary/60" />
        <div className="size-7 rounded-md bg-chart-1/80" />
        <div className="size-7 rounded-md bg-chart-2/70" />
        <div className="size-7 rounded-md bg-primary/40" />
        <div className="size-7 rounded-md bg-chart-1/50" />
        <div className="size-7 rounded-md bg-chart-2/90" />
      </div>
    </Card>
  )
}
