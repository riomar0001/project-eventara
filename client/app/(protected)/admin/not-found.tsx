'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative isolate flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">

      {/* Dot grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: `radial-gradient(circle, color-mix(in oklch, var(--foreground) 7%, transparent) 1px, transparent 1px)`,
          backgroundSize: '26px 26px',
        }}
      />

      {/* Lime radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10"
        style={{
          width: '680px',
          height: '380px',
          background: `radial-gradient(ellipse at center, color-mix(in oklch, var(--primary) 14%, transparent) 0%, transparent 68%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -55%)',
          filter: 'blur(2px)',
        }}
      />

      {/* Lock icon badge */}
      <div
        className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
        style={{
          background: 'color-mix(in oklch, var(--primary) 10%, var(--background))',
          border: '1px solid color-mix(in oklch, var(--primary) 20%, transparent)',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      {/* 404 hero numeral */}
      <div aria-label="404" className="relative select-none leading-none">
        {/* Ghost fill layer — very faint primary */}
        <span
          aria-hidden
          className="absolute inset-0 block text-[9rem] font-black leading-none sm:text-[11rem] lg:text-[13rem]"
          style={{
            color: 'color-mix(in oklch, var(--primary) 7%, transparent)',
            letterSpacing: '-0.04em',
          }}
        >
          404
        </span>
        {/* Outlined layer */}
        <span
          className="relative block text-[9rem] font-black leading-none sm:text-[11rem] lg:text-[13rem]"
          style={{
            WebkitTextStroke: '1.5px var(--primary)',
            color: 'transparent',
            letterSpacing: '-0.04em',
          }}
        >
          404
        </span>
      </div>

      {/* Text content */}
      <div className="mt-4 max-w-[20rem] space-y-2.5">
        <h1
          className="text-[1.125rem] font-semibold leading-snug tracking-tight"
          style={{ color: 'var(--foreground)' }}
        >
          Page not found
        </h1>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--muted-foreground)' }}
        >
          This page doesn&apos;t exist or you don&apos;t have permission to view it.
          If you think this is a mistake, contact your administrator.
        </p>
      </div>

      {/* Hairline divider */}
      <div
        className="mt-8 mb-6 h-px w-10 rounded-full"
        style={{ background: 'color-mix(in oklch, var(--border) 80%, transparent)' }}
      />

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-2.5 sm:flex-row">
        <Link
          href="/admin/dashboard"
          className="inline-flex h-9 items-center justify-center rounded-lg px-5 text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          Go to dashboard
        </Link>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-9 items-center justify-center rounded-lg border px-5 text-sm font-medium transition-all hover:bg-[color-mix(in_oklch,var(--muted)_60%,transparent)] active:scale-[0.98]"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)',
          }}
        >
          Go back
        </button>
      </div>
    </div>
  );
}
