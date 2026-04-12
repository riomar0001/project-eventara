'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PARTICLES = [
  { top: '8%', left: '78%', dur: '9s', del: '0s' },
  { top: '68%', left: '12%', dur: '11s', del: '2s' },
  { top: '35%', left: '92%', dur: '8s', del: '1s' },
  { top: '88%', left: '60%', dur: '7s', del: '3.5s' },
  { top: '18%', left: '35%', dur: '10s', del: '0.5s' },
  { top: '52%', left: '5%', dur: '13s', del: '4s' },
];

export default function SignUpPage() {
  return (
    <>
      <style>{`
        @keyframes su-blob-drift-a {
          0%,100% { transform: translate(0px,0px) scale(1); }
          33% { transform: translate(-55px,60px) scale(1.09); }
          66% { transform: translate(45px,-40px) scale(0.92); }
        }
        @keyframes su-blob-drift-b {
          0%,100% { transform: translate(0px,0px) scale(1); }
          30% { transform: translate(70px,-50px) scale(1.11); }
          65% { transform: translate(-45px,60px) scale(0.89); }
        }
        @keyframes su-blob-drift-c {
          0%,100% { transform: translate(0px,0px) scale(1); }
          45% { transform: translate(-60px,-60px) scale(1.07); }
          80% { transform: translate(50px,40px) scale(0.94); }
        }
        @keyframes su-particle-rise {
          0%,100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.65; }
        }
        .su-blob-a { animation: su-blob-drift-a 16s ease-in-out infinite; }
        .su-blob-b { animation: su-blob-drift-b 12s ease-in-out infinite; }
        .su-blob-c { animation: su-blob-drift-c 20s ease-in-out infinite; }
        .su-particle { animation: su-particle-rise linear infinite; }
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
        <div className="su-blob-a absolute -right-40 -top-20 h-[520px] w-[520px] rounded-full bg-primary/18 blur-[130px]" />
        <div className="su-blob-b absolute -bottom-48 -left-32 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="su-blob-c absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[80px]" />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 15%, oklch(0.08 0 0) 75%)' }}
        />

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="su-particle absolute h-1.5 w-1.5 rounded-full bg-primary/50"
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
                <h1 className="text-xl font-bold tracking-tight text-foreground">Create an account</h1>
                <p className="mt-1 text-sm text-muted-foreground">Start managing your events for free</p>
              </div>

              <form className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">Full name</label>
                  <Input id="name" type="text" placeholder="John Doe" autoComplete="name" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                  <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                  <Input id="password" type="password" placeholder="••••••••" autoComplete="new-password" />
                </div>

                <Button type="submit" size="lg" className="mt-2 w-full">
                  Create account
                </Button>
              </form>

              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/signin" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
