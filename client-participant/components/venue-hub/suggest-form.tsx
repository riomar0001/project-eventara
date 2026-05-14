'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useSuggestVenue } from '@/hooks/venues/use-suggest-venue';
import { AMENITY_OPTIONS } from '@/constants/amenities';
import { VENUE_TYPES } from '@/constants/venue-types';
import type { VenueType, Amenity } from '@/types/venue';

const INPUT =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none';

const labelCls = 'mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground';
const errorCls = 'mt-1 text-[12px] text-destructive';

export function SuggestForm() {
  const { form, errors, submitting, setField, toggleAmenity, handleSubmit } = useSuggestVenue();

  return (
    <div className="rounded-3xl border border-border bg-card px-8 py-8 shadow-lg">
      <div className="mb-7">
        <span className="inline-flex items-center gap-2.5 font-mono text-xs tracking-widest text-muted-foreground uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--lime-glow)]" />
          VENUE HUB
        </span>
        <h1 className="mt-3 text-[28px] font-bold tracking-[-0.03em] text-foreground">Suggest a venue</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">Know a great space for Davao DeFi events? Share it with the community.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelCls}>Venue name</label>
          <input className={INPUT} value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g., SMX Convention Center" />
          {errors.name && <p className={errorCls}>{errors.name}</p>}
        </div>

        <div>
          <label className={labelCls}>Location</label>
          <input className={INPUT} value={form.location} onChange={(e) => setField('location', e.target.value)} placeholder="e.g., Lanang, Davao City" />
          {errors.location && <p className={errorCls}>{errors.location}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Capacity</label>
            <input type="number" min="1" className={INPUT} value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} placeholder="500" />
            {errors.capacity && <p className={errorCls}>{errors.capacity}</p>}
          </div>
          <div>
            <label className={labelCls}>Venue type</label>
            <select className={INPUT} value={form.type} onChange={(e) => setField('type', e.target.value as VenueType)}>
              <option value="">Select type…</option>
              {VENUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.type && <p className={errorCls}>{errors.type}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Amenities</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AMENITY_OPTIONS.map((opt) => {
              const selected = form.amenities.includes(opt.key as Amenity);
              return (
                <button key={opt.key} type="button" onClick={() => toggleAmenity(opt.key as Amenity)}
                  className={`rounded-xl border px-3 py-2 text-[13px] font-medium transition-all ${
                    selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground'
                  }`}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea className={`${INPUT} resize-none`} rows={3} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="What makes this venue special?" />
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">Venue contact (optional)</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] text-muted-foreground">Contact name</label>
              <input className={INPUT} value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] text-muted-foreground">Contact email</label>
              <input type="email" className={INPUT} value={form.contactEmail} onChange={(e) => setField('contactEmail', e.target.value)} placeholder="jane@venue.com" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-border pt-2">
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60">
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? 'Submitting…' : 'Submit suggestion'}
          </button>
          <Link href="/venues" className="flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-muted-foreground transition-all hover:border-muted-foreground">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
