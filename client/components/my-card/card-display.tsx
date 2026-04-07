export function CardDisplay() {
  return (
    <div className="relative flex gap-3">
      {/* Debit card */}
      <div className="relative h-36 flex-1 rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-4 text-primary-foreground shadow-md">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold">Debit card</span>
          <span className="text-sm font-bold italic">VISA</span>
        </div>
        <div className="mt-4 text-[10px] tracking-widest opacity-80">**** **** **** 7890</div>
        <div className="mt-1 flex items-end justify-between">
          <span className="text-[10px] opacity-80">Michael Johnson</span>
          <span className="text-[10px] opacity-80">03/30</span>
        </div>
      </div>

      {/* Credit card (partially visible) */}
      <div className="relative h-36 w-[105px] shrink-0 rounded-2xl bg-muted p-3 shadow-md">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground">Credit card</span>
        </div>
        <div className="mt-4 text-[9px] tracking-widest text-muted-foreground">**** ****</div>
        <div className="mt-1 text-[9px] text-muted-foreground truncate">Michael Joh...</div>
      </div>
    </div>
  )
}
