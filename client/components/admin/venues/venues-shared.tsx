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
  eyebrow = 'Venue Portfolio',
  metrics,
  title,
  tone = 'amber'
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
  specs,
  tags,
  photo,
  subtitle,
  title
}: {
  badges: string[];
  description: string;
  editHref: string;
  href: string;
  specs: { icon: React.ReactNode; label: string; value: string }[];
  tags: string[];
  photo: string;
  subtitle: string;
  title: string;
}) {
  return (
    <Card className="border-0 bg-white py-0 shadow-none ring-1 ring-neutral-200 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-20px_rgba(180,83,9,0.18)] hover:ring-amber-200">
      <PhotoPanel photo={photo} className="h-52 rounded-t-xl rounded-b-[28px]">
        <div className="flex h-full flex-col justify-between p-5">
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge key={badge} variant="secondary" className="border-0 bg-black/45 text-white/90 shadow-xs backdrop-blur-sm">
                {badge}
              </Badge>
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] tracking-[0.2em] text-white/65 uppercase">{subtitle}</p>
            <h3 className="text-xl leading-snug font-semibold tracking-tight text-white">{title}</h3>
          </div>
        </div>
      </PhotoPanel>

      <CardContent className="space-y-4 py-5">
        <p className="line-clamp-2 text-sm leading-6 text-neutral-500">{description}</p>

        {/* Spec row — inline with icons, no boxes */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          {specs.map((spec) => (
            <div key={spec.label} className="flex items-center gap-2 text-[13px] text-neutral-500">
              <span className="shrink-0 text-neutral-400">{spec.icon}</span>
              <span className="truncate font-medium text-neutral-800">{spec.value}</span>
            </div>
          ))}
        </div>

        {/* Tag pill row */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
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
        <div key={item.label} className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="text-[11px] tracking-[0.16em] text-neutral-500 uppercase">{item.label}</p>
          <p className="mt-1 text-sm leading-6 font-medium text-neutral-950">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
