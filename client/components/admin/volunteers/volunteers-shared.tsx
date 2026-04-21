import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AdminPageHero, type AdminPageHeroTone } from '@/components/admin/shared/admin-page-hero';
import { Button } from '@/components/ui/button';

type MetricItem = {
  hint: string;
  label: string;
  value: number | string;
};

export function OperationsPageIntro({
  actions,
  description,
  eyebrow = 'Volunteer Command',
  metrics,
  title,
  tone = 'emerald'
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
