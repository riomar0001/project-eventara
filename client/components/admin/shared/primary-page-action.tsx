import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PrimaryPageActionProps {
  cta: string;
  helper: string;
  href: string;
  label: string;
  theme?: 'amber' | 'emerald' | 'sky';
}

const panelThemes = {
  amber: {
    panel: 'border-amber-300/55 bg-white/76 text-stone-950 shadow-[0_18px_55px_-32px_rgba(180,83,9,0.35)]',
    label: 'text-amber-800',
    helper: 'text-stone-600',
    button: 'bg-amber-500 text-black hover:bg-amber-400'
  },
  emerald: {
    panel: 'border-emerald-300/55 bg-white/76 text-stone-950 shadow-[0_18px_55px_-32px_rgba(6,95,70,0.32)]',
    label: 'text-emerald-800',
    helper: 'text-stone-600',
    button: 'bg-emerald-600 text-white hover:bg-emerald-500'
  },
  sky: {
    panel: 'border-sky-300/55 bg-white/76 text-slate-950 shadow-[0_18px_55px_-32px_rgba(2,132,199,0.28)]',
    label: 'text-sky-800',
    helper: 'text-slate-600',
    button: 'bg-sky-600 text-white hover:bg-sky-500'
  }
} as const;

export function PrimaryPageAction({ cta, helper, href, label, theme = 'sky' }: PrimaryPageActionProps) {
  const styles = panelThemes[theme];

  return (
    <div className={cn('w-full max-w-[18rem] rounded-[24px] border p-3.5 backdrop-blur-sm xl:max-w-76', styles.panel)}>
      <p className={cn('text-[10px] font-semibold tracking-[0.24em] uppercase', styles.label)}>{label}</p>
      <p className={cn('mt-1 text-[13px] leading-5', styles.helper)}>{helper}</p>
      <Button
        asChild
        size="lg"
        className={cn('mt-3 h-11 w-full rounded-xl border-0 font-semibold shadow-[0_14px_35px_-18px_rgba(15,23,42,0.45)]', styles.button)}
      >
        <Link href={href}>
          {cta}
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

interface MobileFloatingActionProps {
  cta: string;
  href: string;
  theme?: 'amber' | 'emerald' | 'sky';
}

const floatingThemes = {
  amber: 'border-amber-200/80 bg-white/88 shadow-[0_20px_45px_-26px_rgba(180,83,9,0.32)]',
  emerald: 'border-emerald-200/80 bg-white/88 shadow-[0_20px_45px_-26px_rgba(6,95,70,0.28)]',
  sky: 'border-sky-200/80 bg-white/88 shadow-[0_20px_45px_-26px_rgba(2,132,199,0.28)]'
} as const;

export function MobileFloatingAction({ cta, href, theme = 'sky' }: MobileFloatingActionProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4 sm:hidden">
      <div className={cn('pointer-events-auto mx-auto max-w-sm rounded-full border p-2 backdrop-blur-md', floatingThemes[theme])}>
        <Button
          asChild
          size="lg"
          className="h-11 w-full rounded-full border-0 bg-neutral-950 text-white shadow-[0_16px_30px_-18px_rgba(15,23,42,0.5)] hover:bg-neutral-800"
        >
          <Link href={href}>{cta}</Link>
        </Button>
      </div>
    </div>
  );
}
