import { ArrowUpCircle, Send, CornerUpRight, History, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

const actions = [
  { label: "Top up", icon: ArrowUpCircle },
  { label: "Send", icon: Send },
  { label: "Request", icon: CornerUpRight },
  { label: "History", icon: History },
  { label: "More", icon: MoreHorizontal },
]

export function QuickActions() {
  return (
    <div className="flex items-center justify-between">
      {actions.map(({ label, icon: Icon }) => (
        <div key={label} className="flex flex-col items-center gap-1">
          <Button variant="outline" size="icon-sm">
            <Icon className="size-4" />
          </Button>
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}
