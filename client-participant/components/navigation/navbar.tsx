'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Auth } from '@/api/sdk.gen';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'Venue Hub', href: '/venues' },
  { label: 'About', href: '/#about' }
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    if (refreshToken) {
      await Auth.logoutAuthLogoutPost({ body: { refresh_token: refreshToken } }).catch(() => {});
    }
    clearAuth();
    router.push('/login');
  }

  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';
  const displayName = firstName ? `${firstName}${lastName ? ` ${lastName[0]}.` : ''}` : (user?.email?.split('@')[0] ?? '');
  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : firstName
    ? firstName[0].toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? '?');

  return (
    <nav className="border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur-lg backdrop-saturate-[140%]">
      <div className="mx-auto grid h-[68px] max-w-[1240px] grid-cols-[1fr_auto_1fr] items-center gap-6 px-8">
        <Link href="/" className="flex items-center gap-2.5 text-[18px] font-bold tracking-[-0.02em]">
          <div className="from-primary to-primary/80 grid h-[26px] w-[26px] place-items-center rounded-lg bg-linear-[145deg] shadow-[0_0_18px_-4px_var(--lime-glow)]">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M2 10 L10 2 L18 10 L10 18 Z" stroke="#fff" strokeWidth="2" fill="none" />
              <circle cx="10" cy="10" r="2.5" fill="#fff" />
            </svg>
          </div>
          <span className="text-foreground">Eventara</span>
        </Link>

        <div className="flex items-center justify-center gap-1">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={label}
                href={href}
                className={`relative rounded-xl px-4 py-2 text-[14.5px] transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label}
                {isActive && <span className="bg-primary absolute right-4 bottom-[-1px] left-4 h-[2px] rounded-[2px] shadow-[0_0_10px_var(--lime-glow)]" />}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2.5">
          {!isInitialized ? (
            <div className="bg-muted h-9 w-28 animate-pulse rounded-full" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                className="border-border hover:border-muted-foreground hover:bg-muted/10 flex items-center gap-2.5 rounded-full border px-[14px] py-1 pl-1 transition-all"
                onClick={() => setOpen((o) => !o)}
              >
                <div className="from-primary grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linear-[135deg] to-orange-400 text-[12.5px] font-bold text-white">
                  {initials}
                </div>
                <div className="text-left">
                  <div className="text-foreground max-w-[120px] truncate text-[13.5px] font-medium">{displayName}</div>
                  <div className="text-primary font-mono text-[10.5px] tracking-[0.14em] uppercase">Participant</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {open && (
                <div className="border-border bg-card absolute right-0 z-50 mt-2 min-w-[200px] rounded-xl border p-1.5 shadow-[0_12px_40px_-16px_oklch(0_0_0_/_0.18)]">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:bg-muted/50 hover:text-foreground flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13px] transition-all"
                  >
                    My Profile
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                  <Link
                    href="/profile/settings/profile"
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:bg-muted/50 hover:text-foreground flex w-full items-center rounded-lg px-3 py-2.5 text-[13px] transition-all"
                  >
                    Account settings
                  </Link>
                  <Link
                    href="/profile/my-events"
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:bg-muted/50 hover:text-foreground flex w-full items-center rounded-lg px-3 py-2.5 text-[13px] transition-all"
                  >
                    My Events
                  </Link>
                  <div className="bg-border mx-2 my-1.5 h-px" />
                  <button
                    onClick={handleSignOut}
                    className="hover:bg-muted/50 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[13px] text-orange-400 transition-all"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground rounded-full px-4 py-2 text-[14px] font-medium transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-[14px] font-semibold shadow-[0_6px_20px_-8px_var(--lime-glow)] transition-all hover:-translate-y-0.5"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
