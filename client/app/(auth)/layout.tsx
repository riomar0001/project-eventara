export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-white px-4 py-12">
      {/* ── Dot-grid pattern ─────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, oklch(0.82 0 0) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* ── Gradient orbs ────────────────────────────────────────────── */}
      {/* top-left primary orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 size-[520px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, oklch(0.841 0.238 128.85), oklch(0.768 0.233 130.85 / 0))',
          animation: 'auth-float-a 18s ease-in-out infinite'
        }}
      />
      {/* bottom-right accent orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-24 size-[460px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 60% 60%, oklch(0.841 0.238 128.85), oklch(0.879 0.169 91.605 / 0))',
          animation: 'auth-float-b 22s ease-in-out infinite'
        }}
      />
      {/* center-right small orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[15%] top-[20%] size-[260px] rounded-full opacity-20 blur-2xl"
        style={{
          background:
            'radial-gradient(circle, oklch(0.769 0.188 70.08), oklch(0.769 0.188 70.08 / 0))',
          animation: 'auth-float-c 14s ease-in-out infinite'
        }}
      />

      {/* ── Vignette fade to keep edges from being too vivid ─────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, oklch(1 0 0 / 0.55) 100%)'
        }}
      />

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6">
        {/* Wordmark */}
        <span className="text-xl font-bold tracking-tight">
          EVENT<span className="text-primary">ARA</span>
        </span>

        {/* Card — entrance animation driven by CSS keyframes */}
        <div
          className="w-full"
          style={{ animation: 'auth-card-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
