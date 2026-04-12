'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PARTICLES = [
  { top: '14%', left: '88%', dur: '9s', del: '0s' },
  { top: '78%', left: '18%', dur: '12s', del: '1.8s' },
  { top: '45%', left: '5%', dur: '8s', del: '0.4s' },
  { top: '20%', left: '42%', dur: '10s', del: '3s' },
  { top: '90%', left: '72%', dur: '7s', del: '2.6s' },
  { top: '55%', left: '95%', dur: '11s', del: '1.2s' },
];

export default function ForgotPasswordPage() {
  return (
    <>
      <style>{`
        @keyframes fp-blob-drift-a {
          0%,100% { transform: translate(0px,0px) scale(1); }
          30% { transform: translate(60px,55px) scale(1.07); }
          65% { transform: translate(-50px,-45px) scale(0.93); }
        }
        @keyframes fp-blob-drift-b {
          0%,100% { transform: translate(0px,0px) scale(1); }
          35% { transform: translate(-70px,-60px) scale(1.1); }
          70% { transform: translate(55px,50px) scale(0.91); }
        }
        @keyframes fp-blob-drift-c {
          0%,100% { transform: translate(0px,0px) scale(1); }
          50% { transform: translate(40px,-70px) scale(1.08); }
        }
        @keyframes fp-particle-rise {
          0%,100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-18px) rotate(180deg); opacity: 0.65; }
        }
        .fp-blob-a { animation: fp-blob-drift-a 15s ease-in-out infinite; }
        .fp-blob-b { animation: fp-blob-drift-b 20s ease-in-out infinite; }
        .fp-blob-c { animation: fp-blob-drift-c 10s ease-in-out infinite; }
        .fp-particle { animation: fp-particle-rise linear infinite; }
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
        <div className="fp-blob-a absolute -bottom-20 -left-36 h-[480px] w-[480px] rounded-full bg-primary/18 blur-[130px]" />
        <div className="fp-blob-b absolute -right-24 top-0 h-[440px] w-[440px] rounded-full bg-primary/14 blur-[110px]" />
        <div className="fp-blob-c absolute left-1/4 top-1/4 h-[260px] w-[260px] rounded-full bg-primary/10 blur-[80px]" />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 15%, oklch(0.08 0 0) 75%)' }}
        />

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="fp-particle absolute h-1.5 w-1.5 rounded-full bg-primary/50"
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

              {/* Lock icon badge */}
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
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Forgot your password?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              <form className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                  <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" />
                </div>

                <Button type="submit" size="lg" className="mt-2 w-full">
                  Send reset link
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Remembered it?{' '}
                <Link href="/signin" className="font-medium text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
