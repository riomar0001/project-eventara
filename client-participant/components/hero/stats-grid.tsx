"use client"

import { cn } from "@/lib/utils"
import { HERO_STATS } from "@/constants/stats"
import { Stat } from "@/types/common"

interface StatsGridProps {
  stats?: Stat[]
}

export function StatsGrid({ stats = HERO_STATS }: StatsGridProps) {
  return (
    <div className="grid grid-cols-3 divide-x divide-[var(--line-soft)] rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)]">
      {stats.map((stat, index) => (
        <div key={index} className="px-6 py-5.5 text-left">
          <div
            className={cn(
              "text-2xl font-semibold tracking-tight",
              stat.color === "lime" && "text-[var(--lime)]",
              stat.color === "amber" && "text-[var(--amber)]",
              !stat.color && "text-[var(--text)]"
            )}
          >
            {stat.value}
          </div>
          <div className="mt-1 font-mono text-xs tracking-widest text-[var(--text-mute)] uppercase">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}
