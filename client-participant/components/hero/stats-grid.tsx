"use client"

export function StatsGrid() {
  const stats = [
    { value: "42", label: "Events this quarter", color: "lime" },
    { value: "2,184", label: "Community members", color: "default" },
    { value: "1 LIVE", label: "Happening now", color: "amber" },
    { value: "Davao", label: "Home base · PH", color: "default" },
  ]

  return (
    <div className="grid grid-cols-4 border-b border-t border-[var(--line-soft)]">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`px-[18px] py-[22px] text-left ${index < stats.length - 1 ? "border-r border-[var(--line-soft)]" : ""}`}
        >
          <div
            className={`text-[28px] font-semibold tracking-[-0.03em] ${
              stat.color === "lime"
                ? "text-[var(--lime)]"
                : stat.color === "amber"
                  ? "text-[var(--amber)]"
                  : "text-[var(--text)]"
            }`}
          >
            {stat.value}
          </div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--text-mute)]">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}
