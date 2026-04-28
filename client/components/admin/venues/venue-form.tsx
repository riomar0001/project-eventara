'use client';

import { useState } from 'react';
import { ImagePlus, Save } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BackLink, FieldLabel, PhotoPanel } from './venues-shared';
import { ADMIN_OPERATIONS_PATHS, type VenueRecord } from '@/constants/admin/operations';

// ── Amenity options ────────────────────────────────────────────────────────────
const AMENITY_OPTIONS = ['Air Conditioning', 'Parking', 'Wi-Fi', 'Catering', 'AV Equipment', 'Stage', 'Dressing Room', 'Wheelchair Access'];

// ── VenueRecord shape expected by this form ────────────────────────────────────
// Mirrors the domain `Venue` entity (venue_entities.py) field-for-field.
export interface VenueFormValues {
  // identity
  name: string;
  description: string;
  // address
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  region: string;
  country: string;
  // venue meta
  capacity: string; // kept as string for controlled input; cast on submit
  venue_type: 'indoor' | 'outdoor' | 'hybrid';
  is_partner: boolean;
  amenities: string[];
  // contact
  contact_name: string;
  contact_phone: string;
  contact_email: string;
}

function defaultValues(venue?: VenueRecord): VenueFormValues {
  return {
    name: venue?.name ?? '',
    description: venue?.description ?? '',
    address_line: venue?.address_line ?? '',
    city: venue?.city ?? '',
    province: venue?.province ?? '',
    postal_code: venue?.postal_code ?? '',
    region: venue?.region ?? '',
    country: venue?.country ?? 'Philippines',
    capacity: venue?.capacity ? String(venue.capacity) : '',
    venue_type: venue?.venue_type ?? 'indoor',
    is_partner: venue?.is_partner ?? false,
    amenities: venue?.amenities ?? [],
    contact_name: venue?.contact_name ?? '',
    contact_phone: venue?.contact_phone ?? '',
    contact_email: venue?.contact_email ?? ''
  };
}

// ── Component ──────────────────────────────────────────────────────────────────
export function VenueForm({ mode, venue }: { mode: 'create' | 'edit'; venue?: VenueRecord }) {
  const [form, setForm] = useState<VenueFormValues>(() => defaultValues(venue));

  const previewPhoto = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=80';

  // Generic field updater
  function set<K extends keyof VenueFormValues>(key: K, value: VenueFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAmenity(amenity: string) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity) ? prev.amenities.filter((a) => a !== amenity) : [...prev.amenities, amenity]
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    // TODO: wire to create_venue / update_venue use-case via API route
    console.log('submit', { ...form, capacity: Number(form.capacity) });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <BackLink href={ADMIN_OPERATIONS_PATHS.venues} label="Back to venues" />
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs tracking-[0.18em] uppercase">
          UI preview only
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        {/* ── Left column: form ──────────────────────────────────────────── */}
        <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
          <CardHeader className="border-b border-neutral-200/80 pb-5">
            <CardTitle>{mode === 'create' ? 'Add venue' : `Edit ${venue?.name ?? 'venue'}`}</CardTitle>
            <CardDescription>
              All fields map directly to the <code>Venue</code> domain entity. Inputs are interactive for design review; submit wires to the use-case layer.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* ── Section: Basic info ──────────────────────────────────── */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold tracking-[0.18em] text-neutral-400 uppercase">Basic information</legend>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <FieldLabel htmlFor="venue-name">Venue name *</FieldLabel>
                    <Input
                      id="venue-name"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="e.g. SMX Convention Center"
                      maxLength={255}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <FieldLabel htmlFor="venue-description">Description</FieldLabel>
                    <Textarea
                      id="venue-description"
                      value={form.description}
                      onChange={(e) => set('description', e.target.value)}
                      placeholder="Describe the space, its best use, and any operational notes."
                      className="min-h-24"
                      maxLength={1000}
                    />
                    <p className="text-right text-[11px] text-neutral-400">{form.description.length} / 1000</p>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor="venue-type">Venue type *</FieldLabel>
                    <Select value={form.venue_type} onValueChange={(v) => set('venue_type', v as VenueFormValues['venue_type'])}>
                      <SelectTrigger id="venue-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indoor">Indoor</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor="venue-capacity">Capacity (guests) *</FieldLabel>
                    <Input
                      id="venue-capacity"
                      type="number"
                      min={1}
                      value={form.capacity}
                      onChange={(e) => set('capacity', e.target.value)}
                      placeholder="250"
                      required
                    />
                  </div>
                </div>

                {/* is_partner toggle */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                  <Checkbox checked={form.is_partner} onCheckedChange={(checked) => set('is_partner', !!checked)} />
                  <span>
                    <span className="font-medium text-neutral-900">Partner venue</span>
                    <span className="ml-2 text-neutral-500">Mark as an Eventara partner space with elevated visibility.</span>
                  </span>
                </label>
              </fieldset>

              {/* ── Section: Address ─────────────────────────────────────── */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold tracking-[0.18em] text-neutral-400 uppercase">Address</legend>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <FieldLabel htmlFor="venue-address">Address line *</FieldLabel>
                    <Input
                      id="venue-address"
                      value={form.address_line}
                      onChange={(e) => set('address_line', e.target.value)}
                      placeholder="123 Roxas Ave, Poblacion District"
                      maxLength={255}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor="venue-city">City *</FieldLabel>
                    <Input id="venue-city" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Davao City" maxLength={100} required />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor="venue-province">Province *</FieldLabel>
                    <Input
                      id="venue-province"
                      value={form.province}
                      onChange={(e) => set('province', e.target.value)}
                      placeholder="Davao del Sur"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor="venue-postal">Postal code *</FieldLabel>
                    <Input
                      id="venue-postal"
                      value={form.postal_code}
                      onChange={(e) => set('postal_code', e.target.value)}
                      placeholder="8000"
                      maxLength={20}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor="venue-region">Region *</FieldLabel>
                    <Input
                      id="venue-region"
                      value={form.region}
                      onChange={(e) => set('region', e.target.value)}
                      placeholder="Region XI (Davao Region)"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <FieldLabel htmlFor="venue-country">Country *</FieldLabel>
                    <Input
                      id="venue-country"
                      value={form.country}
                      onChange={(e) => set('country', e.target.value)}
                      placeholder="Philippines"
                      maxLength={100}
                      required
                    />
                  </div>
                </div>
              </fieldset>

              {/* ── Section: Contact ─────────────────────────────────────── */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold tracking-[0.18em] text-neutral-400 uppercase">Lead contact</legend>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <FieldLabel htmlFor="contact-name">Contact name *</FieldLabel>
                    <Input
                      id="contact-name"
                      value={form.contact_name}
                      onChange={(e) => set('contact_name', e.target.value)}
                      placeholder="Maria Santos"
                      maxLength={255}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor="contact-phone">Phone *</FieldLabel>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={form.contact_phone}
                      onChange={(e) => set('contact_phone', e.target.value)}
                      placeholder="+63 912 345 6789"
                      maxLength={20}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor="contact-email">Email *</FieldLabel>
                    <Input
                      id="contact-email"
                      type="email"
                      value={form.contact_email}
                      onChange={(e) => set('contact_email', e.target.value)}
                      placeholder="venue@example.com"
                      maxLength={255}
                      required
                    />
                  </div>
                </div>
              </fieldset>

              {/* ── Section: Amenities ───────────────────────────────────── */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold tracking-[0.18em] text-neutral-400 uppercase">Amenities</legend>
                <div className="grid gap-3 md:grid-cols-2">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700"
                    >
                      <Checkbox checked={form.amenities.includes(amenity)} onCheckedChange={() => toggleAmenity(amenity)} />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* ── Actions ─────────────────────────────────────────────── */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit">
                  <Save className="size-4" />
                  {mode === 'create' ? 'Save venue' : 'Save changes'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={ADMIN_OPERATIONS_PATHS.venues}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Right column: live preview ─────────────────────────────────── */}
        <div className="space-y-6">
          <PhotoPanel photo={previewPhoto} className="min-h-70">
            <div className="flex min-h-70 flex-col justify-between p-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="w-fit bg-white/85 text-neutral-900">
                  Preview card
                </Badge>
                {form.is_partner && (
                  <Badge variant="secondary" className="bg-amber-400/90 text-amber-950">
                    Partner
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs tracking-[0.18em] text-white/75 uppercase">{[form.city, form.province].filter(Boolean).join(', ') || 'City, Province'}</p>
                <h2 className="text-3xl font-semibold tracking-tight text-white">{form.name || 'Untitled venue'}</h2>
                <p className="max-w-xl text-sm leading-6 text-white/85">{form.description || 'Your venue description will appear here as you type.'}</p>
              </div>
            </div>
          </PhotoPanel>

          <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
            <CardHeader className="border-b border-neutral-200/80 pb-4">
              <CardTitle>Preview summary</CardTitle>
              <CardDescription>Live snapshot of the form values.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6 text-sm leading-6 text-neutral-600">
              {/* Address preview */}
              <div className="space-y-0.5 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">Address</p>
                <p className="font-medium text-neutral-900">
                  {[form.address_line, form.city, form.province, form.postal_code, form.country].filter(Boolean).join(', ') || '—'}
                </p>
              </div>

              {/* Capacity + type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">Capacity</p>
                  <p className="mt-0.5 font-medium text-neutral-900">{form.capacity ? `${Number(form.capacity).toLocaleString()} guests` : '—'}</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">Type</p>
                  <p className="mt-0.5 font-medium text-neutral-900 capitalize">{form.venue_type}</p>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-0.5 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">Contact</p>
                <p className="font-medium text-neutral-900">{form.contact_name || '—'}</p>
                <p className="text-neutral-500">{form.contact_email || ''}</p>
                <p className="text-neutral-500">{form.contact_phone || ''}</p>
              </div>

              {/* Amenities */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">Amenities</p>
                {form.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {form.amenities.map((a) => (
                      <span key={a} className="rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-400">No amenities selected.</p>
                )}
              </div>

              {/* Photo upload placeholder */}
              <div className="rounded-xl border border-dashed border-neutral-200 px-4 py-4 text-neutral-500">
                <div className="flex items-center gap-2">
                  <ImagePlus className="size-4" />
                  Photo upload is intentionally mocked for this design pass.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
