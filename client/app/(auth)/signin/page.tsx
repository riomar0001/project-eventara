'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PARTICLES = [
  { top: '10%', left: '15%', dur: '8s', del: '0s' },
  { top: '75%', left: '80%', dur: '10s', del: '1.5s' },
  { top: '40%', left: '88%', dur: '7s', del: '3.2s' },
  { top: '82%', left: '22%', dur: '9s', del: '0.8s' },
  { top: '22%', left: '52%', dur: '11s', del: '2.1s' },
  { top: '58%', left: '8%', dur: '6s', del: '4.5s' },
];

export default function SignInPage() {
  return (
    <>
      <style>{`
        @keyframes blob-drift-a {
          0%,100% { transform: translate(0px,0px) scale(1); }
          33% { transform: translate(50px,-70px) scale(1.08); }
          66% { transform: translate(-40px,35px) scale(0.93); }
        }
        @keyframes blob-drift-b {
          0%,100% { transform: translate(0px,0px) scale(1); }
          30% { transform: translate(-65px,45px) scale(1.1); }
          65% { transform: translate(55px,-55px) scale(0.9); }
        }
        @keyframes blob-drift-c {
          0%,100% { transform: translate(0px,0px) scale(1); }
          40% { transform: translate(70px,55px) scale(1.12); }
          75% { transform: translate(-55px,-25px) scale(0.88); }
        }
        @keyframes particle-rise {
          0%,100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-22px) rotate(180deg); opacity: 0.7; }
        }
        .si-blob-a { animation: blob-drift-a 14s ease-in-out infinite; }
        .si-blob-b { animation: blob-drift-b 19s ease-in-out infinite; }
        .si-blob-c { animation: blob-drift-c 11s ease-in-out infinite; }
        .si-particle { animation: particle-rise linear infinite; }
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

        {/* Ambient aurora blobs */}
        <div className="si-blob-a absolute -left-48 -top-12 h-[560px] w-[560px] rounded-full bg-primary/20 blur-[140px]" />
        <div className="si-blob-b absolute -bottom-40 -right-24 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[110px]" />
        <div className="si-blob-c absolute right-1/3 top-1/3 h-[320px] w-[320px] rounded-full bg-primary/10 blur-[90px]" />

        {/* Radial vignette */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 15%, oklch(0.08 0 0) 75%)' }}
        />

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="si-particle absolute h-1.5 w-1.5 rounded-full bg-primary/50"
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

              <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Welcome back</h1>
                <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to Eventara</p>
              </div>

              <form className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                  <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" />
                </div>

                <Button type="submit" size="lg" className="mt-2 w-full">
                  Sign in
                </Button>
              </form>

              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                No account?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
