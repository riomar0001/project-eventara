import type { ReactNode } from 'react';
import Link from 'next/link';

function DecorativePanel() {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:flex-1">
      <div className="from-primary/10 via-primary/20 to-primary/15 absolute inset-0 bg-linear-to-br" />

      <div className="absolute -top-48 -right-48 size-187.5 rounded-full border border-white/20" />
      <div className="absolute top-8 -right-12 size-137.5 rounded-full border border-white/25 bg-white/5" />
      <div className="absolute top-24 right-8 size-95 rounded-full border border-white/30" />
      <div className="bg-primary/15 absolute top-44 right-28 size-57.5 rounded-full" />
      <div className="bg-primary/20 absolute top-60 right-44 size-30 rounded-full" />

      <div className="absolute -bottom-28 -left-28 size-100 rounded-full border border-white/15" />
      <div className="absolute bottom-16 left-8 size-40 rounded-full bg-white/10" />

      <div className="absolute right-12 bottom-12 left-10">
        <blockquote>
          <p className="text-foreground/65 text-[1.05rem] leading-relaxed font-medium">
            &quot;Every great event starts with a great connection. We help you build both.&quot;
          </p>
          <footer className="text-foreground/40 mt-3 text-sm">— Eventara</footer>
        </blockquote>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex w-full flex-col bg-white lg:max-w-120">
        <div className="px-10 pt-8">
          <Link href="/" className="inline-block">
            <span className="text-foreground text-xl font-bold tracking-tight">
              event<span className="text-primary">ara</span>
            </span>
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center px-10 py-8">{children}</div>
      </div>

      <DecorativePanel />
    </div>
  );
}
