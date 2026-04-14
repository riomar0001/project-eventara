'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock3, Shield, Trash2, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsItems = [
  { label: 'Profile', href: '/profile', icon: UserRound },
  { label: 'Security', href: '/security', icon: Shield },
  { label: 'Login History', href: '/login-history', icon: Clock3 },
  { label: 'Delete Account', href: '/delete-account', icon: Trash2, destructive: true }
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SettingsShell({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-xs">
      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b bg-neutral-50/80 lg:border-r lg:border-b-0">
          <div className="border-b border-border px-5 py-5">
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage your account</p>
          </div>

          <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-col">
            {settingsItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex min-w-fit items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition-colors lg:min-w-0',
                    active ? 'border-primary/20 bg-white text-foreground shadow-xs' : 'border-transparent text-muted-foreground hover:bg-white hover:text-foreground',
                    item.destructive && !active && 'text-red-600 hover:text-red-700'
                  )}
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="p-5 lg:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">{title}</h2>
            {description ? <p className="text-muted-foreground mt-1 text-sm">{description}</p> : null}
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
