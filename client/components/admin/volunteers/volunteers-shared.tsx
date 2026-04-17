import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card className="border-0 bg-linear-to-br from-emerald-50 via-white to-lime-50 shadow-none ring-1 ring-neutral-200">
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
