import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MetricItem = {
  hint: string;
  label: string;
  value: number | string;
};

export function OperationsPageIntro({
  actions,
  description,
  metrics,
  title
}: {
  actions?: React.ReactNode;
  description: string;
  metrics: MetricItem[];
  title: string;
}) {
  return (
    <Card className="border-0 bg-linear-to-br from-amber-50 via-white to-stone-50 shadow-none ring-1 ring-neutral-200">
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

export function PhotoPanel({ children, className, photo }: { children?: React.ReactNode; className?: string; photo: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[32px] border border-white/60 bg-neutral-900 text-white shadow-[0_24px_80px_-38px_rgba(180,83,9,0.45)]',
        className
      )}
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
  title
}: {
  badges: string[];
  description: string;
  editHref: string;
  href: string;
  meta: { label: string; value: string }[];
  photo: string;
  subtitle: string;
  title: string;
}) {
  return (
    <Card className="border-0 bg-white py-0 shadow-none ring-1 ring-neutral-200">
      <PhotoPanel photo={photo} className="h-64 rounded-t-xl rounded-b-[28px]">
        <div className="flex h-full flex-col justify-between p-5">
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge key={badge} variant="secondary" className="border-0 bg-white/90 text-amber-900 shadow-xs">
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
