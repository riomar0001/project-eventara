'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/navbar';
import { Footer } from '@/components/footer/footer';
import { useVolunteerApplication } from '@/hooks/use-volunteer-application';
import { useVolunteerRoles } from '@/hooks/use-volunteer-roles';
import { useAuthStore } from '@/store/auth-store';

const REASONS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Build Real Connections',
    body: 'Work alongside event organizers, speakers, and fellow participants to grow your professional network in the Web3 and tech community.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: 'Gain Hands-On Experience',
    body: 'Event production, logistics, community coordination — real skills that look great on a portfolio and prepare you for leadership roles.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Exclusive Early Access',
    body: 'Volunteers get priority access to event sessions, speaker meet-and-greets, and behind-the-scenes moments before doors open.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: 'Recognition & Perks',
    body: 'Earn official volunteer credentials, swag, meals on event days, and a certificate of recognition you can share publicly.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Grow Your Skills',
    body: 'From community management to AV setup and guest coordination, every role teaches you something new in a real-world environment.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: 'Give Back to the Community',
    body: 'Be the reason someone has an unforgettable experience. Your effort directly shapes the atmosphere and memories of every event.',
  },
];

const INITIAL = { preferred_role: '', contact_phone: '', reason: '', skills_experience: '', availability: '' };

export default function VolunteerPage() {
  const [form, setForm] = useState(INITIAL);
  const { submit, loading, error, submitted } = useVolunteerApplication();
  const { roles, loading: rolesLoading, error: rolesError } = useVolunteerRoles();
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit(form);
  }

  return (
    <div className="bg-background relative min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 top-0 z-0 h-[700px] overflow-hidden">
        <div className="absolute top-[-200px] left-[-160px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,oklch(0.9_0.22_128_/_0.35),transparent_65%)] blur-[90px]" />
        <div className="absolute top-[-100px] right-[-120px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,oklch(0.82_0.17_75_/_0.22),transparent_65%)] blur-[90px]" />
        <div className="absolute inset-0 bg-[linear-gradient(var(--line-soft,oklch(0_0_0_/_0.04))_1px,transparent_1px),linear-gradient(90deg,var(--line-soft,oklch(0_0_0_/_0.04))_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_30%,transparent_75%)] bg-[length:64px_64px] opacity-30" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* ── Hero ── */}
        <section className="px-4 pt-16 pb-12 md:px-8 md:pt-24 md:pb-16">
          <div className="mx-auto max-w-[1240px]">
            <div className="text-muted-foreground mb-4 inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase">
              <span className="bg-primary h-1.5 w-1.5 rounded-full shadow-[0_0_12px_var(--lime-glow)]" />
              VOLUNTEER PROGRAMME · EVENTARA
            </div>
            <h1 className="text-foreground text-[clamp(36px,5vw,68px)] leading-none font-bold tracking-[-0.035em]">
              Are you ready to<br />
              <span className="text-primary">make an impact?</span>
            </h1>
            <p className="text-muted-foreground mt-5 max-w-[58ch] text-[16px] leading-[1.6]">
              Join the Eventara volunteer team and help shape unforgettable experiences for the Davao tech and Web3 community. No prior experience needed — just passion and a willingness to show up.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#apply"
                className="bg-primary text-primary-foreground rounded-full px-6 py-3 text-[14.5px] font-semibold shadow-[0_8px_24px_-8px_var(--lime-glow)] transition-all hover:-translate-y-0.5"
              >
                Apply now
              </a>
              <a
                href="#why-volunteer"
                className="border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground rounded-full border px-6 py-3 text-[14.5px] font-medium transition-all"
              >
                Learn more
              </a>
            </div>
          </div>
        </section>

        {/* ── Interest banner ── */}
        <section className="px-4 pb-14 md:px-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="border-primary/20 bg-primary/5 relative overflow-hidden rounded-2xl border p-6 md:p-8">
              <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(ellipse_at_right,oklch(0.9_0.22_128_/_0.12),transparent_70%)]" />
              <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-primary font-mono text-[11px] tracking-[0.18em] uppercase">Still on the fence?</p>
                  <h2 className="text-foreground mt-1 text-xl font-bold tracking-[-0.02em] md:text-2xl">
                    Interested in volunteering?
                  </h2>
                  <p className="text-muted-foreground mt-1.5 max-w-[50ch] text-[14px] leading-relaxed">
                    Scroll down to see what roles are available, what you stand to gain, and exactly what we&apos;re looking for. Then hit apply — it takes less than 3 minutes.
                  </p>
                </div>
                <a
                  href="#apply"
                  className="bg-primary text-primary-foreground shrink-0 rounded-full px-5 py-2.5 text-[13.5px] font-semibold shadow-[0_6px_18px_-6px_var(--lime-glow)] transition-all hover:-translate-y-0.5"
                >
                  I&apos;m interested →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Why volunteer ── */}
        <section id="why-volunteer" className="px-4 pb-16 md:px-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-10">
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">Why join us</p>
              <h2 className="text-foreground mt-1.5 text-[clamp(24px,3.5vw,38px)] font-bold tracking-[-0.025em]">
                Why you should volunteer
              </h2>
              <p className="text-muted-foreground mt-2 max-w-[55ch] text-[15px] leading-relaxed">
                Volunteering with Eventara is more than showing up — it&apos;s a launchpad for growth, community, and experience.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {REASONS.map(({ icon, title, body }) => (
                <div key={title} className="border-border bg-card group rounded-2xl border p-5 transition-all hover:border-primary/40 hover:shadow-sm">
                  <div className="text-primary bg-primary/10 mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl">
                    {icon}
                  </div>
                  <h3 className="text-foreground text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>
                  <p className="text-muted-foreground mt-1.5 text-[13.5px] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Available roles ── */}
        <section className="px-4 pb-16 md:px-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="border-border bg-card rounded-2xl border p-6 md:p-8">
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">Open positions</p>
              <h2 className="text-foreground mt-1.5 text-xl font-bold tracking-[-0.02em] md:text-2xl">Volunteer roles available</h2>
              <p className="text-muted-foreground mt-1.5 text-[14px]">Choose the role that fits you best when you apply.</p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {rolesLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border-border bg-muted/40 h-[46px] animate-pulse rounded-xl border" />
                  ))
                ) : rolesError ? (
                  <p className="text-muted-foreground col-span-2 text-[13.5px] sm:col-span-3">{rolesError}</p>
                ) : (
                  roles.map((role) => (
                    <div key={role.id} className="border-border hover:border-primary/50 hover:bg-primary/5 flex items-center gap-3 rounded-xl border px-4 py-3 transition-all">
                      <span className="text-foreground text-[13.5px] font-medium">{role.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Application form ── */}
        <section id="apply" className="px-4 pb-20 md:px-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="grid gap-8 lg:grid-cols-[1fr_480px]">
              <div className="flex flex-col justify-center">
                <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">Ready to join?</p>
                <h2 className="text-foreground mt-1.5 text-[clamp(24px,3.5vw,38px)] font-bold tracking-[-0.025em]">
                  Apply to volunteer
                </h2>
                <p className="text-muted-foreground mt-3 max-w-[46ch] text-[14.5px] leading-relaxed">
                  Fill out the short form and we&apos;ll review your application within 3–5 business days. Accepted volunteers are notified by email.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    { step: '01', text: 'Submit your application below' },
                    { step: '02', text: 'We review and match you to a role' },
                    { step: '03', text: 'Get onboarded before the event' },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-center gap-4">
                      <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold tracking-wider">
                        {step}
                      </div>
                      <p className="text-muted-foreground text-[14px]">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-border bg-card rounded-2xl border p-6 md:p-8">
                {!isAuthenticated ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <h3 className="text-foreground text-xl font-bold tracking-[-0.02em]">Sign in to apply</h3>
                    <p className="text-muted-foreground mt-2 max-w-[30ch] text-[14px] leading-relaxed">
                      You need to be logged in to submit a volunteer application.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 w-full max-w-[220px]">
                      <Link
                        href={`/login?redirect=/volunteer%23apply`}
                        className="bg-primary text-primary-foreground flex items-center justify-center rounded-full px-5 py-2.5 text-[13.5px] font-semibold shadow-[0_6px_18px_-6px_var(--lime-glow)] transition-all hover:-translate-y-0.5"
                      >
                        Log in
                      </Link>
                      <Link
                        href="/register"
                        className="border-border text-muted-foreground hover:text-foreground rounded-full border px-5 py-2.5 text-[13.5px] font-medium text-center transition-all hover:bg-muted/40"
                      >
                        Create an account
                      </Link>
                    </div>
                  </div>
                ) : submitted ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h3 className="text-foreground text-xl font-bold tracking-[-0.02em]">Application submitted!</h3>
                    <p className="text-muted-foreground mt-2 max-w-[30ch] text-[14px] leading-relaxed">
                      Thank you for applying. We&apos;ll review your application and get back to you within 3–5 business days.
                    </p>
                    <Link
                      href="/profile"
                      className="border-border text-muted-foreground hover:text-foreground mt-6 rounded-xl border px-5 py-2.5 text-[13.5px] font-medium transition-all hover:bg-muted/40"
                    >
                      Back to profile
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-foreground text-lg font-bold tracking-[-0.02em]">Volunteer Application</h3>

                    <div>
                      <label className="text-muted-foreground mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase">
                        Preferred role <span className="text-orange-400">*</span>
                      </label>
                      <select
                        name="preferred_role"
                        value={form.preferred_role}
                        onChange={handleChange}
                        required
                        className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-[13.5px] outline-none transition-colors"
                      >
                        <option value="">Select a role…</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.name}>{role.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-muted-foreground mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase">
                        Phone number <span className="text-orange-400">*</span>
                      </label>
                      <input
                        name="contact_phone"
                        type="tel"
                        value={form.contact_phone}
                        onChange={handleChange}
                        required
                        placeholder="+63 9XX XXX XXXX"
                        className="border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-[13.5px] outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-muted-foreground mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase">
                        Why do you want to volunteer? <span className="text-orange-400">*</span>
                      </label>
                      <textarea
                        name="reason"
                        value={form.reason}
                        onChange={handleChange}
                        required
                        rows={3}
                        placeholder="Tell us what motivates you to join the team…"
                        className="border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:border-primary w-full resize-none rounded-xl border px-3.5 py-2.5 text-[13.5px] outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-muted-foreground mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase">
                        Relevant skills or experience
                      </label>
                      <textarea
                        name="skills_experience"
                        value={form.skills_experience}
                        onChange={handleChange}
                        rows={2}
                        placeholder="e.g. event coordination, photography, customer service…"
                        className="border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:border-primary w-full resize-none rounded-xl border px-3.5 py-2.5 text-[13.5px] outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-muted-foreground mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase">
                        Availability <span className="text-orange-400">*</span>
                      </label>
                      <select
                        name="availability"
                        value={form.availability}
                        onChange={handleChange}
                        required
                        className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-[13.5px] outline-none transition-colors"
                      >
                        <option value="">Select availability…</option>
                        <option value="weekdays">Weekdays</option>
                        <option value="weekends">Weekends</option>
                        <option value="both">Both weekdays &amp; weekends</option>
                        <option value="flexible">Flexible / event-by-event</option>
                      </select>
                    </div>

                    {error && (
                      <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-primary text-primary-foreground mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3 text-[14px] font-semibold shadow-[0_8px_24px_-8px_var(--lime-glow)] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
                    >
                      {loading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                          </svg>
                          Submitting…
                        </>
                      ) : (
                        'Submit application'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
