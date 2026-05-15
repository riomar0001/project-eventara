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
      <div className="border-border bg-card rounded-2xl border p-5">
        <p className="text-muted-foreground mb-4 font-mono text-[11px] tracking-[0.14em] uppercase">What happens next?</p>
        <div className="space-y-4">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-3">
              <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold">
                {s.n}
              </div>
              <div>
                <p className="text-foreground text-[13px] font-semibold">{s.title}</p>
                <p className="text-muted-foreground text-[12px]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <p className="text-foreground mb-3 text-[13px] font-semibold">Good venues typically have:</p>
        <ul className="space-y-2">
          {CHECKLIST.map((item) => (
            <li key={item} className="text-muted-foreground flex items-center gap-2 text-[13px]">
              <CheckCircle2 size={13} className="text-primary shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
