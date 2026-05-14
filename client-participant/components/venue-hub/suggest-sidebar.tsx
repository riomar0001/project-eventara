import { CheckCircle2 } from 'lucide-react';

const STEPS = [
  { n: '01', title: 'Review', desc: 'Our team reviews the venue within 2–3 business days.' },
  { n: '02', title: 'Verification', desc: 'We reach out to confirm details and capacity.' },
  { n: '03', title: 'Published', desc: 'Approved venues appear in the Venue Hub for all members.' }
];

const CHECKLIST = ['50+ seat capacity', 'Stable power + WiFi', 'Accessible by public transit', 'AV / presentation support', 'Indoor or weather-safe space'];

export function SuggestSidebar() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-4 font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">What happens next?</p>
        <div className="space-y-4">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">{s.n}</div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">{s.title}</p>
                <p className="text-[12px] text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-[13px] font-semibold text-foreground">Good venues typically have:</p>
        <ul className="space-y-2">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <CheckCircle2 size={13} className="shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
