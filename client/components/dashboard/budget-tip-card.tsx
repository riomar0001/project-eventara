import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function BudgetTipCard() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <p className="text-sm leading-snug font-semibold">Optimize your budget with these quick tips</p>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 text-xs leading-relaxed">Start preparing for the 2025 tax season by saving 10–15% for deductions.</p>
        <Button variant="ghost" size="sm" className="gap-1 p-0 text-xs font-medium hover:bg-transparent">
          Read more <ArrowRight className="size-3" />
        </Button>
      </CardContent>

      {/* Decorative blocks */}
      <div className="absolute top-1/2 right-4 grid -translate-y-1/2 grid-cols-2 gap-1 opacity-80">
        <div className="bg-primary/60 size-7 rounded-xl" />
        <div className="bg-chart-1/80 size-7 rounded-xl" />
        <div className="bg-chart-2/70 size-7 rounded-xl" />
        <div className="bg-primary/40 size-7 rounded-xl" />
        <div className="bg-chart-1/50 size-7 rounded-xl" />
        <div className="bg-chart-2/90 size-7 rounded-xl" />
      </div>
    </Card>
  );
}
