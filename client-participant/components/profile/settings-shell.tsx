'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Lock, Trash2, User, Clock } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/profile/settings/profile', label: 'Profile', icon: User, desc: 'Personal info and preferences' },
  { href: '/profile/settings/password', label: 'Password', icon: Lock, desc: 'Change your password' },
  { href: '/profile/settings/login-history', label: 'Login History', icon: Clock, desc: 'Recent sign-in activity' },
  { href: '/profile/settings/delete-account', label: 'Delete Account', icon: Trash2, desc: 'Permanently remove your account' }
];

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = NAV_ITEMS.find((n) => pathname.startsWith(n.href));

  return (
    <div className="mx-auto max-w-[1240px] px-8 py-10">
        <div className="mb-7">
          <span className="inline-flex items-center gap-2.5 font-mono text-xs tracking-widest text-muted-foreground uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--lime-glow)]" />
            SETTINGS
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-foreground">{active?.label ?? 'Account Settings'}</h1>
          {active?.desc && <p className="mt-1 text-sm text-muted-foreground">{active.desc}</p>}
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside>
            <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2 lg:flex-col">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const isDelete = item.href.includes('delete-account');
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex min-w-fit items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all lg:min-w-0 ${
                      isActive
                        ? isDelete ? 'bg-destructive/10 text-destructive' : 'bg-primary text-primary-foreground'
                        : isDelete ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                    <item.icon size={15} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="mt-auto border-t border-border pt-2 lg:mt-2">
                <Link href="/profile" className="flex w-full min-w-fit items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-muted-foreground transition-all hover:bg-muted/50 lg:min-w-0">
                  ← View profile
                </Link>
              </div>
            </nav>
          </aside>

          <main className="rounded-2xl border border-border bg-card p-6 lg:p-8">{children}</main>
        </div>
      </div>
  );
}
