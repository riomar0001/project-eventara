import type { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <span className="text-foreground text-2xl font-bold tracking-tight">
            event<span className="text-primary">ara</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
