import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type AdminPageHeroTone = 'amber' | 'emerald' | 'lime' | 'midnight' | 'orange' | 'sky' | 'slate';

export interface AdminPageHeroMetric {
  emphasis?: 'accent' | 'default';
  hint: string;
  label: string;
  value: number | string;
}

interface AdminPageHeroProps {
  actions?: React.ReactNode;
  className?: string;
  description: string;
  eyebrow?: React.ReactNode;
  metrics: AdminPageHeroMetric[];
  metricsColumns?: 3 | 4;
  title: string;
  tone?: AdminPageHeroTone;
}

type ToneStyles = {
  badge: string;
  card: string;
  description: string;
  divider: string;
  glow: string;
  metric: string;
  metricAccent: string;
  metricHint: string;
  metricLabel: string;
  metricValue: string;
  overlay: string;
  title: string;
};

const heroTones = {
  amber: {
    card: 'bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_32%),radial-gradient(circle_at_88%_18%,_rgba(251,191,36,0.22),_transparent_26%),linear-gradient(135deg,_#fffbeb_0%,_#fff7ed_46%,_#ffffff_100%)] ring-amber-200/80 text-stone-950',
    overlay: 'bg-[linear-gradient(120deg,rgba(255,255,255,0.38)_0%,transparent_18%,transparent_78%,rgba(146,64,14,0.07)_100%)]',
    glow: 'bg-amber-300/35',
    divider: 'via-amber-500/28',
    badge: 'border-amber-400/35 bg-white/70 text-amber-900',
    title: 'text-stone-950',
    description: 'text-stone-700',
    metric: 'border-white/75 bg-white/76',
    metricAccent: 'border-amber-300/55 bg-amber-100/82',
    metricLabel: 'text-stone-500',
    metricValue: 'text-stone-950',
    metricHint: 'text-stone-600'
  },
  sky: {
    card: 'bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_34%),radial-gradient(circle_at_88%_20%,_rgba(125,211,252,0.2),_transparent_24%),linear-gradient(135deg,_#f0f9ff_0%,_#ecfeff_44%,_#ffffff_100%)] ring-sky-200/80 text-slate-950',
    overlay: 'bg-[linear-gradient(120deg,rgba(255,255,255,0.36)_0%,transparent_18%,transparent_78%,rgba(14,116,144,0.08)_100%)]',
    glow: 'bg-sky-300/30',
    divider: 'via-sky-500/28',
    badge: 'border-sky-400/35 bg-white/70 text-sky-900',
    title: 'text-slate-950',
    description: 'text-slate-700',
    metric: 'border-white/75 bg-white/74',
    metricAccent: 'border-sky-300/55 bg-sky-100/82',
    metricLabel: 'text-slate-500',
    metricValue: 'text-slate-950',
    metricHint: 'text-slate-600'
  },
  emerald: {
    card: 'bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.18),_transparent_34%),radial-gradient(circle_at_88%_18%,_rgba(163,230,53,0.2),_transparent_26%),linear-gradient(135deg,_#ecfdf5_0%,_#f7fee7_46%,_#ffffff_100%)] ring-emerald-200/80 text-stone-950',
    overlay: 'bg-[linear-gradient(120deg,rgba(255,255,255,0.36)_0%,transparent_18%,transparent_78%,rgba(6,95,70,0.08)_100%)]',
    glow: 'bg-emerald-300/32',
    divider: 'via-emerald-500/28',
    badge: 'border-emerald-400/35 bg-white/70 text-emerald-900',
    title: 'text-stone-950',
    description: 'text-stone-700',
    metric: 'border-white/75 bg-white/76',
    metricAccent: 'border-emerald-300/55 bg-emerald-100/82',
    metricLabel: 'text-stone-500',
    metricValue: 'text-stone-950',
    metricHint: 'text-stone-600'
  },
  lime: {
    card: 'bg-[radial-gradient(circle_at_top_left,_rgba(163,230,53,0.2),_transparent_34%),radial-gradient(circle_at_88%_18%,_rgba(250,204,21,0.16),_transparent_24%),linear-gradient(135deg,_#f7fee7_0%,_#fefce8_44%,_#ffffff_100%)] ring-lime-200/85 text-neutral-950',
    overlay: 'bg-[linear-gradient(120deg,rgba(255,255,255,0.34)_0%,transparent_18%,transparent_78%,rgba(101,163,13,0.08)_100%)]',
    glow: 'bg-lime-300/34',
    divider: 'via-lime-500/28',
    badge: 'border-lime-400/35 bg-white/72 text-lime-900',
    title: 'text-neutral-950',
    description: 'text-neutral-700',
    metric: 'border-white/75 bg-white/76',
    metricAccent: 'border-lime-300/55 bg-lime-100/85',
    metricLabel: 'text-neutral-500',
    metricValue: 'text-neutral-950',
    metricHint: 'text-neutral-600'
  },
  orange: {
    card: 'bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.16),_transparent_34%),radial-gradient(circle_at_88%_18%,_rgba(253,186,116,0.2),_transparent_24%),linear-gradient(135deg,_#fff7ed_0%,_#fffbeb_44%,_#ffffff_100%)] ring-orange-200/80 text-stone-950',
    overlay: 'bg-[linear-gradient(120deg,rgba(255,255,255,0.36)_0%,transparent_18%,transparent_78%,rgba(154,52,18,0.08)_100%)]',
    glow: 'bg-orange-300/32',
    divider: 'via-orange-500/28',
    badge: 'border-orange-400/35 bg-white/70 text-orange-900',
    title: 'text-stone-950',
    description: 'text-stone-700',
    metric: 'border-white/75 bg-white/76',
    metricAccent: 'border-orange-300/55 bg-orange-100/82',
    metricLabel: 'text-stone-500',
    metricValue: 'text-stone-950',
    metricHint: 'text-stone-600'
  },
  slate: {
    card: 'bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_34%),radial-gradient(circle_at_88%_18%,_rgba(96,165,250,0.16),_transparent_24%),linear-gradient(135deg,_#f8fafc_0%,_#eff6ff_42%,_#ffffff_100%)] ring-slate-200/80 text-slate-950',
    overlay: 'bg-[linear-gradient(120deg,rgba(255,255,255,0.34)_0%,transparent_18%,transparent_78%,rgba(30,41,59,0.08)_100%)]',
    glow: 'bg-slate-300/28',
    divider: 'via-slate-500/24',
    badge: 'border-slate-400/30 bg-white/70 text-slate-800',
    title: 'text-slate-950',
    description: 'text-slate-700',
    metric: 'border-white/75 bg-white/76',
    metricAccent: 'border-slate-300/50 bg-slate-100/85',
    metricLabel: 'text-slate-500',
    metricValue: 'text-slate-950',
    metricHint: 'text-slate-600'
  },
  midnight: {
    card: 'bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_38%),radial-gradient(circle_at_88%_18%,_rgba(56,189,248,0.12),_transparent_26%),linear-gradient(135deg,_#020617_0%,_#0f172a_52%,_#111827_100%)] ring-slate-800/65 text-white',
    overlay: 'bg-[linear-gradient(120deg,rgba(255,255,255,0.05)_0%,transparent_18%,transparent_82%,rgba(255,255,255,0.04)_100%)]',
    glow: 'bg-cyan-300/18',
    divider: 'via-cyan-300/32',
    badge: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
    title: 'text-white',
    description: 'text-slate-200',
    metric: 'border-white/12 bg-white/6',
    metricAccent: 'border-cyan-300/24 bg-cyan-300/8',
    metricLabel: 'text-slate-300',
    metricValue: 'text-white',
    metricHint: 'text-slate-300'
  }
} satisfies Record<AdminPageHeroTone, ToneStyles>;

export function AdminPageHero({ actions, className, description, eyebrow, metrics, metricsColumns = 3, title, tone = 'sky' }: AdminPageHeroProps) {
  const theme = heroTones[tone];

  return (
    <Card className={cn('relative overflow-hidden border-0 py-0 shadow-none ring-1', theme.card, className)}>
      <div className={cn('pointer-events-none absolute inset-0', theme.overlay)} />
      <div className={cn('pointer-events-none absolute -top-24 -right-16 size-64 rounded-full blur-3xl', theme.glow)} />
      <div className={cn('pointer-events-none absolute bottom-0 left-0 h-px w-full bg-linear-to-r from-transparent to-transparent', theme.divider)} />

      <div className="relative px-6 py-4 sm:px-8 sm:py-5">
        <div
          className="flex flex-col gap-4 border-b border-black/6 pb-4 data-[tone=midnight]:border-white/10 xl:flex-row xl:items-end xl:justify-between"
          data-tone={tone}
        >
          <div className="max-w-4xl space-y-2.5">
            {eyebrow ? (
              <div
                className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.24em] uppercase', theme.badge)}
              >
                {eyebrow}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <h1
                className={cn('font-heading max-w-3xl text-[1.9rem] leading-none font-semibold tracking-[-0.04em] text-balance sm:text-[2.3rem]', theme.title)}
              >
                {title}
              </h1>
              <p className={cn('max-w-2xl text-[13px] leading-6 sm:text-sm', theme.description)}>{description}</p>
            </div>
          </div>

          {actions ? <div className="flex shrink-0 flex-wrap gap-2.5 xl:justify-end">{actions}</div> : null}
        </div>

        <div className={cn('mt-4 grid gap-3', metricsColumns === 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-2 xl:grid-cols-3')}>
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={cn(
                'rounded-[22px] border p-3.5 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.35)] backdrop-blur-sm',
                metric.emphasis === 'accent' ? theme.metricAccent : theme.metric
              )}
            >
              <p className={cn('text-[11px] font-semibold tracking-[0.22em] uppercase', theme.metricLabel)}>{metric.label}</p>
              <p className={cn('mt-2 text-[1.55rem] font-semibold tracking-[-0.04em]', theme.metricValue)}>{metric.value}</p>
              <p className={cn('mt-1 text-[13px] leading-5.5', theme.metricHint)}>{metric.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
