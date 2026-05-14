import Link from 'next/link';
import { MeshBg } from '@/components/shared/mesh-bg';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12">
      <MeshBg />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/80 shadow-[0_8px_24px_-8px_var(--lime-glow)]">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M10 2L15 8H12V14H8V8H5L10 2Z" fill="#0a1005" /></svg>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold tracking-[-0.02em] text-foreground">Eventara</div>
            <div className="mt-0.5 font-mono text-[11px] tracking-[0.18em] uppercase text-muted-foreground">Davao DeFi Community</div>
          </div>
        </div>
        <LoginForm />
        <div className="mt-5 text-center">
          <Link href="/" className="text-[13px] text-muted-foreground transition-colors hover:underline">← Back to home</Link>
        </div>
      </div>
    </main>
  );
}
