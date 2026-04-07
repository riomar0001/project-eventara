import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CardDisplay } from "./card-display"
import { QuickActions } from "./quick-actions"
import { QuickPayment } from "./quick-payment"
import { TransactionHistory } from "./transaction-history"

export function CardPanel() {
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">My card</p>
          <p className="text-[10px] text-muted-foreground">Quick actions</p>
        </div>
        <Button variant="ghost" size="xs" className="gap-1">
          <Plus className="size-3" /> Add card
        </Button>
      </div>

      <CardDisplay />

      <QuickActions />

      <Separator />

      <QuickPayment />

      <Separator />

      <TransactionHistory />
    </div>
  )
}
