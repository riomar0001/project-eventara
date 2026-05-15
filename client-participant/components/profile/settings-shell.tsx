'use client';

import { Lock, Trash2, User, Clock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
        <span className="text-muted-foreground inline-flex items-center gap-2.5 font-mono text-xs tracking-widest uppercase">
          <span className="bg-primary h-1.5 w-1.5 rounded-full shadow-[0_0_12px_var(--lime-glow)]" />
          SETTINGS
        </span>
        <h1 className="text-foreground mt-3 text-3xl font-bold tracking-[-0.03em]">{active?.label ?? 'Account Settings'}</h1>
        {active?.desc && <p className="text-muted-foreground mt-1 text-sm">{active.desc}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside>
          <nav className="border-border bg-card flex gap-2 overflow-x-auto rounded-2xl border p-2 lg:flex-col">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const isDelete = item.href.includes('delete-account');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-fit items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all lg:min-w-0 ${
                    isActive
                      ? isDelete
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-primary text-primary-foreground'
                      : isDelete
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                  }`}
                >
                  <item.icon size={15} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="border-border mt-auto border-t pt-2 lg:mt-2">
              <Link
                href="/profile"
                className="text-muted-foreground hover:bg-muted/50 flex w-full min-w-fit items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all lg:min-w-0"
              >
                ← View profile
              </Link>
            </div>
          </nav>
        </aside>

        <main className="border-border bg-card rounded-2xl border p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
