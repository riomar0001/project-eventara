'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PARTICLES = [
  { top: '6%', left: '30%', dur: '10s', del: '0s' },
  { top: '80%', left: '70%', dur: '8s', del: '1.3s' },
  { top: '48%', left: '94%', dur: '12s', del: '2.7s' },
  { top: '25%', left: '8%', dur: '9s', del: '0.6s' },
  { top: '92%', left: '40%', dur: '7s', del: '3.9s' },
  { top: '62%', left: '55%', dur: '11s', del: '5s' },
];

export default function VerifyEmailPage() {
  return (
    <>
      <style>{`
        @keyframes ve-blob-drift-a {
          0%,100% { transform: translate(0px,0px) scale(1); }
          25% { transform: translate(55px,-65px) scale(1.09); }
          60% { transform: translate(-35px,45px) scale(0.92); }
        }
        @keyframes ve-blob-drift-b {
          0%,100% { transform: translate(0px,0px) scale(1); }
          35% { transform: translate(-75px,55px) scale(1.08); }
          70% { transform: translate(60px,-40px) scale(0.93); }
        }
        @keyframes ve-blob-drift-c {
          0%,100% { transform: translate(0px,0px) scale(1); }
          50% { transform: translate(-45px,-65px) scale(1.1); }
        }
        @keyframes ve-particle-rise {
          0%,100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.65; }
        }
        .ve-blob-a { animation: ve-blob-drift-a 13s ease-in-out infinite; }
        .ve-blob-b { animation: ve-blob-drift-b 18s ease-in-out infinite; }
        .ve-blob-c { animation: ve-blob-drift-c 22s ease-in-out infinite; }
        .ve-particle { animation: ve-particle-rise linear infinite; }
      `}</style>

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[oklch(0.08_0_0)] px-4 py-12">

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Aurora blobs */}
        <div className="ve-blob-a absolute -right-32 -top-32 h-[540px] w-[540px] rounded-full bg-primary/18 blur-[140px]" />
        <div className="ve-blob-b absolute -bottom-32 left-0 h-[460px] w-[460px] rounded-full bg-primary/14 blur-[120px]" />
        <div className="ve-blob-c absolute left-2/3 top-1/2 h-[240px] w-[240px] rounded-full bg-primary/10 blur-[70px]" />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 15%, oklch(0.08 0 0) 75%)' }}
        />

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="ve-particle absolute h-1.5 w-1.5 rounded-full bg-primary/50"
            style={{ top: p.top, left: p.left, animationDuration: p.dur, animationDelay: p.del }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">

          {/* Logo */}
          <div className="mb-7 text-center">
            <span className="text-2xl font-bold tracking-tight text-primary">Eventara</span>
            <p className="mt-1 text-xs tracking-widest text-primary/40 uppercase">Event Management</p>
          </div>

          {/* Gradient border card */}
          <div
            className="rounded-2xl p-px"
            style={{
              background: 'linear-gradient(145deg, oklch(0.841 0.238 128.85 / 0.45) 0%, oklch(0.841 0.238 128.85 / 0.1) 45%, transparent 80%)',
              boxShadow: '0 0 80px oklch(0.841 0.238 128.85 / 0.1)',
            }}
          >
            <div className="rounded-[15px] bg-white px-8 py-8">

              {/* Mail icon badge */}
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>

              <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Check your email</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-foreground">you@example.com</span>
                </p>
              </div>

              <form className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Verification code</label>
                  <div className="flex gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        placeholder="·"
                        className="h-11 w-full p-0 text-center text-base font-semibold"
                      />
                    ))}
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Verify email
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Didn&apos;t receive a code?{' '}
                <button type="button" className="font-medium text-primary hover:underline">
                  Resend code
                </button>
              </p>

              <p className="mt-2 text-center text-sm">
                <Link href="/signin" className="text-muted-foreground hover:text-primary hover:underline">
                  ← Back to sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
