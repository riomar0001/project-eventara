"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Navbar } from "@/components/navigation/navbar"
import { Footer } from "@/components/footer/footer"
import { EventsDirectoryCard } from "@/components/events/directory/events-directory-card"
import { EventsDirectoryFeatured } from "@/components/events/directory/events-directory-featured"
import { EventsDirectoryControls } from "@/components/events/directory/events-directory-controls"
import { EventsDirectoryPagination } from "@/components/events/directory/events-directory-pagination"
import { EventsDirectoryModal } from "@/components/modals/events-directory-modal"
import { Icon } from "@/components/events/directory/icon"
import { ALL_EVENTS, CATEGORIES, FEATURED } from "@/constants/events-directory"
import type {
  DirectoryEvent,
  SortOption,
  ViewMode,
  TweaksConfig,
} from "@/types/event-directory"

const TWEAKS_DEFAULTS: TweaksConfig = {
  density: "comfortable",
  bannerVariant: "featured",
  badgeStyle: "floating",
}

const MONTH_IDX: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
}

export default function EventsPage() {
  const [tweaks, setTweaks] = useState<TweaksConfig>(TWEAKS_DEFAULTS)
  const [editMode, setEditMode] = useState(false)
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("All")
  const [sort, setSort] = useState<SortOption>("date")
  const [view, setView] = useState<ViewMode>("grid")
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<DirectoryEvent | null>(null)

  const PER_PAGE = tweaks.density === "compact" ? 8 : 6

  // Listen for edit mode messages (mirrors HTML postMessage API)
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const t = e.data?.type
      if (t === "__activate_edit_mode") setEditMode(true)
      if (t === "__deactivate_edit_mode") setEditMode(false)
    }
    window.addEventListener("message", onMsg)
    window.parent.postMessage({ type: "__edit_mode_available" }, "*")
    return () => window.removeEventListener("message", onMsg)
  }, [])

  // Report tweaks changes
  useEffect(() => {
    window.parent.postMessage(
      { type: "__edit_mode_set_keys", edits: tweaks },
      "*"
    )
  }, [tweaks])

  // Apply badge style via injected CSS
  useEffect(() => {
    const id = "badge-style"
    let sheet = document.getElementById(id) as HTMLStyleElement | null
    if (!sheet) {
      sheet = document.createElement("style")
      sheet.id = id
      document.head.appendChild(sheet)
    }
    if (tweaks.badgeStyle === "lime") {
      sheet.textContent =
        ".date-badge { background: var(--lime) !important; border-color: var(--lime) !important; } .date-badge .mo, .date-badge .day { color: #0a1005 !important; }"
    } else {
      sheet.textContent = ""
    }
  }, [tweaks.badgeStyle])

  // Filtering + sorting
  const filtered = useMemo(() => {
    let list = ALL_EVENTS.slice()
    if (cat !== "All") list = list.filter((e) => e.cat === cat)
    if (q.trim()) {
      const needle = q.toLowerCase()
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(needle) ||
          e.venue.toLowerCase().includes(needle) ||
          e.tags.some((t) => t.toLowerCase().includes(needle)) ||
          e.cat.toLowerCase().includes(needle)
      )
    }
    list.sort((a, b) => {
      if (sort === "date")
        return (
          new Date(a.year, MONTH_IDX[a.mo], +a.day).getTime() -
          new Date(b.year, MONTH_IDX[b.mo], +b.day).getTime()
        )
      if (sort === "popularity")
        return b.total - b.seats - (a.total - a.seats)
      if (sort === "availability") return b.seats - a.seats
      return 0
    })
    return list
  }, [q, cat, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  )

  // Category counts
  const counts = useMemo(() => {
    const obj: Record<string, number> = { All: ALL_EVENTS.length }
    for (const c of CATEGORIES) {
      if (c.key !== "All")
        obj[c.key] = ALL_EVENTS.filter((e) => e.cat === c.key).length
    }
    return obj
  }, [])

  const changeCat = useCallback((c: string) => {
    setCat(c)
    setPage(1)
  }, [])
  const changeQ = useCallback((v: string) => {
    setQ(v)
    setPage(1)
  }, [])

  // Open featured in modal with a synthetic event
  const openFeatured = useCallback(() => {
    setDetail({
      id: 0,
      day: "12",
      mo: "DEC",
      year: 2026,
      date: FEATURED.date,
      time: FEATURED.time,
      title: FEATURED.title,
      desc: FEATURED.desc,
      venue: FEATURED.venue,
      cat: "Meetups",
      tags: ["Gala", "Featured"],
      seats: 80,
      total: 300,
      status: null,
      orb: "amber",
      angle: "115deg",
    })
  }, [])

  return (
    <main style={{ background: "var(--bg)", color: "var(--text)" }}>
      <Navbar />

      <div style={{ position: "relative" }}>
        {/* Page mesh background */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[620px] overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute left-[-180px] top-[-220px] h-[640px] w-[640px] rounded-full blur-[90px]"
            style={{
              background:
                "radial-gradient(circle, oklch(0.9 0.22 128 / 0.45), transparent 65%)",
            }}
          />
          <div
            className="absolute right-[-140px] top-[-120px] h-[540px] w-[540px] rounded-full blur-[90px]"
            style={{
              background:
                "radial-gradient(circle, oklch(0.82 0.17 75 / 0.28), transparent 65%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                "linear-gradient(var(--line-soft) 1px, transparent 1px), linear-gradient(90deg, var(--line-soft) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              maskImage:
                "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)",
            }}
          />
        </div>

        <div
          className="events-dir-container container relative z-[1] mx-auto max-w-[1240px] px-8"
        >
          {/* Page header */}
          <header className="relative pb-9 pt-16">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <span className="eyebrow">
                  <span className="eyebrow-dot" />
                  EVENT DIRECTORY · APR–JUL 2026
                </span>
                <h1
                  className="mx-0 my-[18px] font-bold leading-none tracking-[-0.035em]"
                  style={{
                    fontSize: "clamp(42px, 5.5vw, 72px)",
                    color: "var(--text)",
                  }}
                >
                  Discover Events
                </h1>
                <p
                  className="m-0 mb-9 max-w-[58ch] text-[16px] leading-[1.55]"
                  style={{ color: "var(--text-dim)" }}
                >
                  Browse {ALL_EVENTS.length} upcoming workshops, meetups and
                  hackathons across the Davao DeFi community.
                </p>
              </div>
              <div className="text-right max-sm:text-left">
                <div
                  className="font-mono text-[40px] font-semibold leading-none tracking-[-0.03em]"
                  style={{ color: "var(--lime)" }}
                >
                  {String(ALL_EVENTS.length).padStart(2, "0")}
                </div>
                <div
                  className="mt-[2px] font-mono text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: "var(--text-mute)" }}
                >
                  Active listings
                </div>
              </div>
            </div>

            {/* Controls */}
            <EventsDirectoryControls
              q={q}
              onQChange={changeQ}
              cat={cat}
              onCatChange={changeCat}
              sort={sort}
              onSortChange={(s) => setSort(s)}
              categories={CATEGORIES}
              counts={counts}
            />

            {/* Featured banner */}
            {tweaks.bannerVariant === "featured" && (
              <EventsDirectoryFeatured
                featured={FEATURED}
                onOpen={openFeatured}
              />
            )}
          </header>

          {/* Events list section */}
          <section>
            {/* List controls */}
            <div className="mb-[22px] mt-14 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h3
                  className="m-0 text-[24px] font-semibold tracking-[-0.02em]"
                  style={{ color: "var(--text)" }}
                >
                  {cat === "All" ? "All events" : cat}
                </h3>
                <div
                  className="mt-1 font-mono text-[12px]"
                  style={{ color: "var(--text-mute)" }}
                >
                  {filtered.length} result
                  {filtered.length !== 1 ? "s" : ""}
                  {q && (
                    <>
                      {" "}
                      · query{" "}
                      <span style={{ color: "var(--lime)" }}>
                        &quot;{q}&quot;
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div
                className="flex gap-[2px] rounded-[10px] border p-[3px]"
                style={{ borderColor: "var(--line-soft)" }}
              >
                <button
                  className={`flex items-center gap-[6px] rounded-[7px] px-[10px] py-[7px] text-[12px] transition-all ${
                    view === "grid" ? "shadow-[0_0_0_1px_var(--line-soft)]" : ""
                  }`}
                  style={{
                    background:
                      view === "grid" ? "var(--surface)" : "transparent",
                    color:
                      view === "grid" ? "var(--text)" : "var(--text-mute)",
                  }}
                  onClick={() => setView("grid")}
                >
                  <Icon name="grid" size={13} /> Grid
                </button>
                <button
                  className={`flex items-center gap-[6px] rounded-[7px] px-[10px] py-[7px] text-[12px] transition-all ${
                    view === "list" ? "shadow-[0_0_0_1px_var(--line-soft)]" : ""
                  }`}
                  style={{
                    background:
                      view === "list" ? "var(--surface)" : "transparent",
                    color:
                      view === "list" ? "var(--text)" : "var(--text-mute)",
                  }}
                  onClick={() => setView("list")}
                >
                  <Icon name="list" size={13} /> List
                </button>
              </div>
            </div>

            {/* Grid */}
            <div
              className="events-dir-grid grid gap-[22px]"
              style={{
                gridTemplateColumns:
                  view === "list"
                    ? "1fr"
                    : tweaks.density === "compact"
                      ? "repeat(4, 1fr)"
                      : "repeat(3, 1fr)",
              }}
            >
              {paged.length === 0 ? (
                <div
                  className="col-span-full rounded-[20px] border border-dashed px-10 py-20 text-center"
                  style={{
                    borderColor: "var(--line-soft)",
                    background: "oklch(1 0 0 / 0.015)",
                  }}
                >
                  <div
                    className="mx-auto mb-[18px] grid h-14 w-14 place-items-center rounded-[16px]"
                    style={{ background: "oklch(1 0 0 / 0.04)", color: "var(--text-mute)" }}
                  >
                    <Icon name="search" size={22} />
                  </div>
                  <h4
                    className="m-0 mb-[6px] text-[20px] font-semibold tracking-[-0.02em]"
                    style={{ color: "var(--text)" }}
                  >
                    No events match your filters
                  </h4>
                  <p className="m-0 text-[14px]" style={{ color: "var(--text-dim)" }}>
                    Try a broader search or reset your category selection.
                  </p>
                </div>
              ) : (
                paged.map((ev) => (
                  <EventsDirectoryCard
                    key={ev.id}
                    ev={ev}
                    onOpen={setDetail}
                  />
                ))
              )}
            </div>
          </section>

          {/* Pagination */}
          {filtered.length > 0 && (
            <EventsDirectoryPagination
              currentPage={currentPage}
              totalPages={totalPages}
              filteredLength={filtered.length}
              perPage={PER_PAGE}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      <Footer />

      {/* Detail modal */}
      {detail && (
        <EventsDirectoryModal
          ev={detail}
          onClose={() => setDetail(null)}
        />
      )}

      {/* Tweaks panel (edit mode) */}
      {editMode && (
        <div
          className="fixed bottom-5 right-5 z-80 w-[280px] rounded-[16px] border p-4 text-[13px] shadow-lg"
          style={{
            background: "var(--surface)",
            borderColor: "var(--line)",
            boxShadow: "0 20px 60px -20px oklch(0 0 0 / 0.5)",
            animation: "modal-pop 200ms ease",
          }}
        >
          <h4 className="m-0 mb-3 flex items-center gap-2 text-[13px] font-semibold">
            <span
              className="h-[6px] w-[6px] rounded-full"
              style={{ background: "var(--lime)" }}
            />
            Tweaks
            <button
              className="ml-auto"
              style={{ color: "var(--text-mute)" }}
              onClick={() => setEditMode(false)}
            >
              <Icon name="x" size={14} />
            </button>
          </h4>
          <div
            className="flex items-center justify-between gap-[10px] border-t py-2"
            style={{ borderColor: "var(--line-soft)" }}
          >
            <label className="text-[12.5px]" style={{ color: "var(--text-dim)" }}>
              Grid density
            </label>
            <select
              className="rounded-[6px] border px-[6px] py-1 text-[12px]"
              style={{
                background: "var(--bg)",
                borderColor: "var(--line-soft)",
                color: "var(--text)",
              }}
              value={tweaks.density}
              onChange={(e) =>
                setTweaks({ ...tweaks, density: e.target.value as TweaksConfig["density"] })
              }
            >
              <option value="comfortable">Comfortable (3)</option>
              <option value="compact">Compact (4)</option>
            </select>
          </div>
          <div
            className="flex items-center justify-between gap-[10px] border-t py-2"
            style={{ borderColor: "var(--line-soft)" }}
          >
            <label className="text-[12.5px]" style={{ color: "var(--text-dim)" }}>
              Featured banner
            </label>
            <select
              className="rounded-[6px] border px-[6px] py-1 text-[12px]"
              style={{
                background: "var(--bg)",
                borderColor: "var(--line-soft)",
                color: "var(--text)",
              }}
              value={tweaks.bannerVariant}
              onChange={(e) =>
                setTweaks({ ...tweaks, bannerVariant: e.target.value as TweaksConfig["bannerVariant"] })
              }
            >
              <option value="featured">Show banner</option>
              <option value="hidden">Hide banner</option>
            </select>
          </div>
          <div
            className="flex items-center justify-between gap-[10px] border-t py-2"
            style={{ borderColor: "var(--line-soft)" }}
          >
            <label className="text-[12.5px]" style={{ color: "var(--text-dim)" }}>
              Date badge
            </label>
            <select
              className="rounded-[6px] border px-[6px] py-1 text-[12px]"
              style={{
                background: "var(--bg)",
                borderColor: "var(--line-soft)",
                color: "var(--text)",
              }}
              value={tweaks.badgeStyle}
              onChange={(e) =>
                setTweaks({ ...tweaks, badgeStyle: e.target.value as TweaksConfig["badgeStyle"] })
              }
            >
              <option value="floating">Floating (dark)</option>
              <option value="lime">Solid lime</option>
            </select>
          </div>
        </div>
      )}

      {/* Responsive overrides (global style tag for cross-component reach) */}
      <style>{`
        @media (max-width: 1024px) {
          .events-dir-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 700px) {
          .events-dir-grid { grid-template-columns: 1fr !important; }
          .events-dir-search-row { grid-template-columns: 1fr !important; }
          .events-dir-container { padding: 0 18px !important; }
        }
      `}</style>
    </main>
  )
}
