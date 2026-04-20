import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { AdminPageHero, type AdminPageHeroTone } from '@/components/admin/shared/admin-page-hero';
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
  eyebrow = 'Event Pipeline',
  metrics,
  title,
  tone = 'sky'
}: {
  actions?: React.ReactNode;
  description: string;
  eyebrow?: React.ReactNode;
  metrics: MetricItem[];
  title: string;
  tone?: AdminPageHeroTone;
}) {
  return <AdminPageHero actions={actions} description={description} eyebrow={eyebrow} metrics={metrics} title={title} tone={tone} />;
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
        'relative overflow-hidden rounded-[32px] border border-white/60 bg-neutral-900 text-white shadow-[0_24px_80px_-38px_rgba(14,116,144,0.45)]',
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
    <Card className="group border-0 bg-white py-0 shadow-none ring-1 ring-neutral-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-neutral-200/80 hover:ring-neutral-300">
      <PhotoPanel photo={photo} className="h-64 rounded-t-xl rounded-b-[28px]">
        <div className="flex h-full flex-col justify-between p-5">
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge key={badge} variant="secondary" className="border-0 bg-white/90 text-sky-900 shadow-xs">
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
        <div className="grid gap-y-3 gap-x-6 sm:grid-cols-2">
          {meta.map((item) => (
            <div key={item.label}>
              <p className="text-[11px] tracking-[0.16em] text-neutral-400 uppercase">{item.label}</p>
              <p className="mt-0.5 text-sm font-medium text-neutral-950">{item.value}</p>
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
      <CardHeader className="pb-4">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
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
    <div className="divide-y divide-neutral-100">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
          <p className="text-[11px] tracking-[0.16em] text-neutral-400 uppercase">{item.label}</p>
          <p className="text-sm font-medium text-neutral-950">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
