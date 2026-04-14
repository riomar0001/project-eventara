'use client';

import { Clock3, Shield, Trash2, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const settingsItems = [
  {
    label: 'Profile',
    description: 'Update your personal information.',
    href: '/admin/user/settings/profile',
    icon: UserRound
  },
  {
    label: 'Security',
    description: 'Change your password.',
    href: '/admin/user/settings/password',
    icon: Shield
  },
  {
    label: 'Login History',
    description: 'Review recent sign-ins to your account.',
    href: '/admin/user/settings/login-history',
    icon: Clock3
  },
  {
    label: 'Delete Account',
    description: 'Permanently remove your account.',
    href: '/admin/user/settings/delete-account',
    icon: Trash2,
    destructive: true
  }
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SettingsShell({ title, description, children }: { title?: string; description?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const currentItem = settingsItems.find((item) => isActivePath(pathname, item.href));
  const pageTitle = title ?? currentItem?.label ?? 'Settings';
  const pageDescription = description ?? currentItem?.description;

  return (
    <div className="border-border overflow-hidden rounded-xl border bg-white shadow-xs">
      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b lg:border-r lg:border-b-0">
          <div className="border-border border-b px-5 py-5">
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
                    'flex min-w-fit items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors lg:min-w-0',
                    active ? 'text-foreground bg-neutral-100 shadow-xs' : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-white',
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
            <h2 className="text-2xl font-semibold">{pageTitle}</h2>
            {pageDescription ? <p className="text-muted-foreground mt-1 text-sm">{pageDescription}</p> : null}
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
