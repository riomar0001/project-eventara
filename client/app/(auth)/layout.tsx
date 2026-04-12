export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 0% 0%,   oklch(0.94 0.08 128.85) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 100% 100%, oklch(0.92 0.10 91.60)  0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 100% 0%,  oklch(0.96 0.05 150.00) 0%, transparent 50%),
          oklch(0.98 0.01 128.85)
        `
      }}
    >
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
        className="pointer-events-none absolute -top-32 -left-32 size-130 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 40% 40%, oklch(0.841 0.238 128.85), oklch(0.768 0.233 130.85 / 0))',
          animation: 'auth-float-a 18s ease-in-out infinite'
        }}
      />
      {/* bottom-right accent orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-40 size-115 rounded-full opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 60% 60%, oklch(0.841 0.238 128.85), oklch(0.879 0.169 91.605 / 0))',
          animation: 'auth-float-b 22s ease-in-out infinite'
        }}
      />
      {/* center-right small orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[20%] right-[15%] size-65 rounded-full opacity-20 blur-2xl"
        style={{
          background: 'radial-gradient(circle, oklch(0.769 0.188 70.08), oklch(0.769 0.188 70.08 / 0))',
          animation: 'auth-float-c 14s ease-in-out infinite'
        }}
      />

      {/* ── Vignette fade to keep edges from being too vivid ─────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, oklch(1 0 0 / 0.55) 100%)'
        }}
      />

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="max-h-md relative z-10 flex w-full max-w-md flex-col items-center gap-10">
        {/* Wordmark */}
        <span className="text-2xl font-bold tracking-tight">
          EVENT<span className="text-primary">ARA</span>
        </span>

        {/* Card — entrance animation driven by CSS keyframes */}
        <div className="w-full drop-shadow-2xl" style={{ animation: 'auth-card-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
