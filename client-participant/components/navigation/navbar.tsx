"use client"

export function Navbar() {
  return (
    <nav
      className="sticky top-0 z-40 border-b border-[var(--line-soft)] backdrop-blur-[18px]"
      style={{
        background: "oklch(0.985 0.004 150 / 0.82)",
        backdropFilter: "blur(18px) saturate(140%)",
      }}
    >
      <div className="container mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-[26px] w-[26px] items-center justify-center rounded-lg text-[#0a1005]"
            style={{
              background:
                "linear-gradient(145deg, var(--lime), var(--lime-dim))",
              boxShadow: "0 0 18px -4px var(--lime-glow)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path
                d="M2 10 L10 2 L18 10 L10 18 Z"
                stroke="#0a1005"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="10" cy="10" r="2.5" fill="#0a1005" />
            </svg>
          </div>
          <span className="text-[18px] font-bold tracking-[-0.02em] text-[var(--text)]">
            Eventara
          </span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-1.5">
          <a
            href="#events"
            className="rounded-[10px] px-3.5 py-2 text-[14.5px] text-[var(--text)] transition-colors duration-150 hover:text-[var(--text)]"
          >
            Events
          </a>
          <a
            href="#about"
            className="rounded-[10px] px-3.5 py-2 text-[14.5px] text-[var(--text-dim)] transition-colors duration-150 hover:text-[var(--text)]"
          >
            About
          </a>
          <a
            href="#community"
            className="rounded-[10px] px-3.5 py-2 text-[14.5px] text-[var(--text-dim)] transition-colors duration-150 hover:text-[var(--text)]"
          >
            Community
          </a>
          <button className="btn btn-primary cursor-pointer border-none bg-[var(--lime)] px-[18px] py-[10px] font-[inherit] text-[13.5px] text-white hover:bg-[var(--lime-dim)]">
            Login / Register
          </button>
        </div>
      </div>
    </nav>
  )
}
