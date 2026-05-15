import { Suspense } from 'react';
import Link from 'next/link';
import { VerifyOtpForm } from '@/components/auth/verify-otp-form';
import { MeshBg } from '@/components/shared/mesh-bg';

export default function VerifyOtpPage() {
  return (
    <main className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <MeshBg />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="from-primary to-primary/80 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br shadow-[0_8px_24px_-8px_var(--lime-glow)]">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L15 8H12V14H8V8H5L10 2Z" fill="#0a1005" />
            </svg>
          </div>
          <div className="text-center">
            <div className="text-foreground text-xl font-bold tracking-[-0.02em]">Eventara</div>
            <div className="text-muted-foreground mt-0.5 font-mono text-[11px] tracking-[0.18em] uppercase">Davao DeFi Community</div>
          </div>
        </div>
        <Suspense fallback={<div className="border-border bg-card h-80 rounded-3xl border" />}>
          <VerifyOtpForm />
        </Suspense>
        <div className="mt-5 text-center">
          <Link href="/login" className="text-muted-foreground text-[13px] transition-colors hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
