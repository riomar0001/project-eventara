export function CardDisplay() {
  return (
    <div className="relative flex gap-3">
      {/* Debit card */}
      <div className="from-primary to-primary/70 text-primary-foreground relative h-36 flex-1 rounded-xl bg-linear-to-br p-4 shadow-md">
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
      <div className="bg-muted relative h-36 w-26.25 shrink-0 rounded-xl p-3 shadow-md">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted-foreground text-[10px] font-semibold">Credit card</span>
        </div>
        <div className="text-muted-foreground mt-4 text-[9px] tracking-widest">**** ****</div>
        <div className="text-muted-foreground mt-1 truncate text-[9px]">Michael Joh...</div>
      </div>
    </div>
  );
}
