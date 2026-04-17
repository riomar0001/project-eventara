import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tone = 'event' | 'venue' | 'volunteer';

type MetricItem = {
  hint: string;
  label: string;
  value: number | string;
};

const toneClasses: Record<
  Tone,
  {
    badge: string;
    hero: string;
    photoGlow: string;
    subtle: string;
  }
> = {
  venue: {
    badge: 'border-amber-200 bg-amber-50 text-amber-800',
    hero: 'from-amber-50 via-white to-stone-50',
    photoGlow: 'shadow-[0_24px_80px_-38px_rgba(180,83,9,0.45)]',
    subtle: 'bg-amber-50/70 text-amber-900'
  },
  event: {
    badge: 'border-sky-200 bg-sky-50 text-sky-800',
    hero: 'from-sky-50 via-white to-cyan-50',
    photoGlow: 'shadow-[0_24px_80px_-38px_rgba(14,116,144,0.45)]',
    subtle: 'bg-sky-50/80 text-sky-900'
  },
  volunteer: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    hero: 'from-emerald-50 via-white to-lime-50',
    photoGlow: 'shadow-[0_24px_80px_-38px_rgba(5,150,105,0.45)]',
    subtle: 'bg-emerald-50/80 text-emerald-900'
  }
};

export function OperationsPageIntro({
  actions,
  description,
  metrics,
  title,
  tone
}: {
  actions?: React.ReactNode;
  badge: string;
  description: string;
  metrics: MetricItem[];
  title: string;
  tone: Tone;
}) {
  return (
    <Card className={cn('border-0 bg-linear-to-br shadow-none ring-1 ring-neutral-200', toneClasses[tone].hero)}>
      <CardHeader className="border-b border-neutral-200/80 pb-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-semibold tracking-tight text-neutral-950">{title}</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6 text-neutral-600">{description}</CardDescription>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-neutral-200 bg-white/90 p-5 shadow-xs backdrop-blur-xs">
            <p className="text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-neutral-500">{metric.hint}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={href}>
        <ArrowLeft className="size-4" />
        {label}
      </Link>
    </Button>
  );
}

export function PhotoPanel({ children, className, photo, tone }: { children?: React.ReactNode; className?: string; photo: string; tone: Tone }) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-[32px] border border-white/60 bg-neutral-900 text-white', toneClasses[tone].photoGlow, className)}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.12) 0%, rgba(15,23,42,0.72) 100%), url("${photo}")`,
        backgroundPosition: 'center',
        backgroundSize: 'cover'
      }}
    >
      {children}
    </div>
  );
}

export function CatalogCard({
  badges,
  description,
  editHref,
  href,
  meta,
  photo,
  subtitle,
  title,
  tone
}: {
  badges: string[];
  description: string;
  editHref: string;
  href: string;
  meta: { label: string; value: string }[];
  photo: string;
  subtitle: string;
  title: string;
  tone: Tone;
}) {
  return (
    <Card className="border-0 bg-white py-0 shadow-none ring-1 ring-neutral-200">
      <PhotoPanel photo={photo} tone={tone} className="h-64 rounded-t-xl rounded-b-[28px]">
        <div className="flex h-full flex-col justify-between p-5">
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge key={badge} variant="secondary" className={cn('border-0 bg-white/90 shadow-xs', toneClasses[tone].subtle)}>
                {badge}
              </Badge>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs tracking-[0.2em] text-white/75 uppercase">{subtitle}</p>
            <h3 className="text-2xl font-semibold tracking-tight text-white">{title}</h3>
          </div>
        </div>
      </PhotoPanel>
      <CardContent className="space-y-5 py-6">
        <p className="text-sm leading-6 text-neutral-600">{description}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {meta.map((item) => (
            <div key={item.label} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-[11px] tracking-[0.16em] text-neutral-500 uppercase">{item.label}</p>
              <p className="mt-1 text-sm font-medium text-neutral-950">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={href}>
              View
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={editHref}>Edit</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DetailPanel({ children, description, title }: { children: React.ReactNode; description?: string; title: string }) {
  return (
    <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
      <CardHeader className="border-b border-neutral-200/80 pb-4">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function DetailList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="text-[11px] tracking-[0.16em] text-neutral-500 uppercase">{item.label}</p>
          <p className="mt-1 text-sm leading-6 font-medium text-neutral-950">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
