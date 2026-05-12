"use client"

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Contact", href: "#" },
] as const

function TwitterIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18 4h3l-7.5 8.5L22 22h-6.5l-5-6.5L5 22H2l8-9L2 4h6.5l4.5 6L18 4z" />
    </svg>
  )
}

function DiscordIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.3 4.4a16 16 0 0 0-4-1.3l-.2.4a14 14 0 0 0-4.2 0l-.2-.4a16 16 0 0 0-4 1.3 17.7 17.7 0 0 0-3 11.7 16 16 0 0 0 4.9 2.5l1-1.5a11 11 0 0 1-1.7-.8l.4-.3a11.5 11.5 0 0 0 9.6 0l.4.3a11 11 0 0 1-1.7.8l1 1.5a16 16 0 0 0 5-2.5 17.6 17.6 0 0 0-3-11.7zM9 14c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" />
    </svg>
  )
}

function TelegramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21.5 4.3 2.8 11.6c-1 .4-1 1 0 1.3l4.4 1.4 1.7 5.3c.2.6.4.8 1 .6l3-2.5 4.4 3.2c.9.5 1.5.2 1.7-.8l3-14c.3-1.2-.5-1.7-1.5-1.3zm-3.3 3.4-8.6 7.7-.3 3.6-1.7-5.3 10.6-6.7c.5-.3.9-.1.5.7z" />
    </svg>
  )
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--line-soft)] pb-10 pt-12">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-6 px-8 max-[900px]:px-5">
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 text-lg font-bold tracking-[-0.02em]"
          aria-label="Eventara home"
        >
          <div
            className="grid h-[26px] w-[26px] place-items-center rounded-lg text-[#0a1005]"
            style={{
              background:
                "linear-gradient(145deg, var(--lime), var(--lime-dim))",
              boxShadow: "0 0 18px -4px var(--lime-glow)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 10 L10 2 L18 10 L10 18 Z"
                stroke="#0a1005"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="10" cy="10" r="2.5" fill="#0a1005" />
            </svg>
          </div>
          <span>Eventara</span>
        </a>

        {/* Footer Links */}
        <div className="flex gap-[26px] text-[13.5px] text-[var(--text-dim)]">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-[var(--text)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Socials */}
        <div className="flex gap-2.5">
          <a
            className="ease grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--line-soft)] text-[var(--text-dim)] transition-all duration-[180ms] hover:border-[oklch(0.82_0.17_75_/_0.5)] hover:bg-[oklch(0.82_0.17_75_/_0.06)] hover:text-[var(--amber)]"
            href="#"
            aria-label="Twitter"
            target="_blank"
            rel="noopener noreferrer"
          >
            <TwitterIcon size={15} />
          </a>
          <a
            className="ease grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--line-soft)] text-[var(--text-dim)] transition-all duration-[180ms] hover:border-[oklch(0.82_0.17_75_/_0.5)] hover:bg-[oklch(0.82_0.17_75_/_0.06)] hover:text-[var(--amber)]"
            href="#"
            aria-label="Discord"
            target="_blank"
            rel="noopener noreferrer"
          >
            <DiscordIcon size={16} />
          </a>
          <a
            className="ease grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--line-soft)] text-[var(--text-dim)] transition-all duration-[180ms] hover:border-[oklch(0.82_0.17_75_/_0.5)] hover:bg-[oklch(0.82_0.17_75_/_0.06)] hover:text-[var(--amber)]"
            href="#"
            aria-label="Telegram"
            target="_blank"
            rel="noopener noreferrer"
          >
            <TelegramIcon size={16} />
          </a>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-7 flex max-w-[1240px] flex-wrap justify-between gap-3 px-8 max-[900px]:px-5">
        <div className="font-mono text-[12.5px] text-[var(--text-mute)]">
          &copy; {year} EVENTARA &mdash; Built for the Davao DeFi Community PH.
        </div>
        <div className="font-mono text-[12.5px] text-[var(--text-dim)]">
          <span className="text-[var(--lime)]">&#9679;</span> All systems
          operational
        </div>
      </div>
    </footer>
  )
}
