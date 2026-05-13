'use client';

import { useRef, useState } from 'react';
import { Building2, MapPin, Save, Users, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/context/permissions-context';
import { useVenueForm } from '@/hooks/admin/venues/use-venue-form';
import { BackLink, FieldLabel, PhotoPanel } from './venues-shared';
import type { VenueRecordResponse } from '@/api/types.gen';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { resolveStorageImageUrl } from '@/lib/storage/image-url';

// ── Form shape ─────────────────────────────────────────────────────────────────
export interface VenueFormValues {
  venue_category: 'community' | 'official';
  name: string;
  description: string;
  image_url: string;
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  region: string;
  country: string;
  capacity: string;
  venue_type: 'indoor' | 'outdoor' | 'hybrid';
  amenities: string[];
  contact_name: string;
  contact_phone: string;
  contact_email: string;
}

function defaultValues(venue?: VenueRecordResponse): VenueFormValues {
  return {
    venue_category: venue?.is_partner ? 'official' : 'community',
    name: venue?.name ?? '',
    description: venue?.description ?? '',
    image_url: venue?.image_url ?? '',
    address_line: venue?.address_line ?? '',
    city: venue?.city ?? '',
    province: venue?.province ?? '',
    postal_code: venue?.postal_code ?? '',
    region: venue?.region ?? '',
    country: venue?.country ?? 'Philippines',
    capacity: venue?.capacity ? String(venue.capacity) : '',
    venue_type: venue?.venue_type ?? 'indoor',
    amenities: venue?.amenities ?? [],
    contact_name: venue?.contact_name ?? '',
    contact_phone: venue?.contact_phone ?? '',
    contact_email: venue?.contact_email ?? ''
  };
}

// ── Category selector ──────────────────────────────────────────────────────────
function CategoryTile({
  value,
  current,
  icon: Icon,
  label,
  description,
  onSelect
}: {
  value: 'community' | 'official';
  current: 'community' | 'official';
  icon: React.ElementType;
  label: string;
  description: string;
  onSelect: (v: 'community' | 'official') => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex flex-1 items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
        active ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-400'
      }`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${active ? 'text-white' : 'text-neutral-500'}`} />
      <div>
        <p className={`text-sm font-medium ${active ? 'text-white' : 'text-neutral-900'}`}>{label}</p>
        <p className={`mt-0.5 text-xs leading-5 ${active ? 'text-white/70' : 'text-neutral-500'}`}>{description}</p>
      </div>
    </button>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function VenueForm({ mode, suggestedVenue = false, venue }: { mode: 'create' | 'edit'; suggestedVenue?: boolean; venue?: VenueRecordResponse }) {
  const [form, setForm] = useState<VenueFormValues>(() => defaultValues(venue));
  const { submitCreate, submitEdit, isSubmitting } = useVenueForm();
  const { can } = usePermissions();
  const amenityInputRef = useRef<HTMLInputElement>(null);
  const [amenityDraft, setAmenityDraft] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const canCreatePartnerVenue = can('venues', 'create');
  const canUpdateVenue = can('venues', 'update');
  const canUseOfficialVenueCategory = mode === 'edit' ? canUpdateVenue : canCreatePartnerVenue;
  const venueCategory = canUseOfficialVenueCategory ? form.venue_category : 'community';
  const formTitle = mode === 'create' ? (canCreatePartnerVenue ? 'Add venue' : 'Suggest venue') : `Edit ${venue?.name ?? 'venue'}`;

  const previewPhoto =
    resolveStorageImageUrl(form.image_url) || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=80';

  function set<K extends keyof VenueFormValues>(key: K, value: VenueFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addAmenity(raw: string) {
    const amenity = raw.trim();
    if (!amenity) return;
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.map((a) => a.toLowerCase()).includes(amenity.toLowerCase()) ? prev.amenities : [...prev.amenities, amenity]
    }));
    setAmenityDraft('');
  }

  function removeAmenity(amenity: string) {
    setForm((prev) => ({ ...prev, amenities: prev.amenities.filter((a) => a !== amenity) }));
  }

  function handleAmenityKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAmenity(amenityDraft);
    } else if (e.key === 'Backspace' && amenityDraft === '' && form.amenities.length > 0) {
      removeAmenity(form.amenities[form.amenities.length - 1]);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === 'create') {
      await submitCreate({ ...form, venue_category: venueCategory }, pendingImageFile);
    } else if (venue?.id) {
      await submitEdit(venue.id, form, { suggestedVenue });
    }
  }

  const isOfficial = venueCategory === 'official';

  return (
    <div className="space-y-6">
      <BackLink href={ADMIN_OPERATIONS_PATHS.venues} label="Back to venues" />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        {/* ── Left column: form ──────────────────────────────────────────── */}
        <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
          <CardHeader className="border-b border-neutral-200/80 pb-5">
            <CardTitle>{formTitle}</CardTitle>
            <CardDescription>Fill in the details below. Fields marked * are required.</CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* ── Section: Venue category ──────────────────────────────── */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold tracking-[0.18em] text-neutral-400 uppercase">Venue category *</legend>
                <div className="flex gap-3">
                  <CategoryTile
                    value="community"
                    current={venueCategory}
                    icon={Users}
                    label="Community suggestion"
                    description="A venue suggested by the community. Lead contact is required."
                    onSelect={(v) => set('venue_category', v)}
                  />
                  {canUseOfficialVenueCategory ? (
                    <CategoryTile
                      value="official"
                      current={venueCategory}
                      icon={Building2}
                      label="Official partner venue"
                      description="An officially managed partner space. Contact info is required."
                      onSelect={(v) => set('venue_category', v)}
                    />
                  ) : null}
                </div>
              </fieldset>

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

                  <div className="space-y-2 md:col-span-2">
                    <FieldLabel>Venue image</FieldLabel>
                    <ImageUpload
                      value={form.image_url}
                      onChange={(value) => set('image_url', value)}
                      resourceType="venue-image"
                      resourceId={venue?.id}
                      deferUpload={mode === 'create'}
                      onFileSelected={setPendingImageFile}
                      disabled={isSubmitting}
                      className="aspect-video w-full"
                    />
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
                <legend className="text-xs font-semibold tracking-[0.18em] text-neutral-400 uppercase">Lead contact *</legend>
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
                <div
                  className="flex min-h-12 cursor-text flex-wrap gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5"
                  onClick={() => amenityInputRef.current?.focus()}
                >
                  {form.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAmenity(amenity);
                        }}
                        className="text-neutral-400 hover:text-neutral-700"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={amenityInputRef}
                    type="text"
                    value={amenityDraft}
                    onChange={(e) => setAmenityDraft(e.target.value)}
                    onKeyDown={handleAmenityKeyDown}
                    onBlur={() => addAmenity(amenityDraft)}
                    placeholder={form.amenities.length === 0 ? 'Type an amenity and press Enter…' : ''}
                    className="min-w-40 flex-1 bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
                  />
                </div>
                <p className="text-[11px] text-neutral-400">Press Enter to add. Backspace on empty input removes the last tag.</p>
              </fieldset>

              {/* ── Actions ─────────────────────────────────────────────── */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="size-4" />
                  {isSubmitting ? 'Saving…' : mode === 'create' ? (canCreatePartnerVenue ? 'Save venue' : 'Submit suggestion') : 'Save changes'}
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
                {isOfficial && <span className="rounded-full bg-amber-400/90 px-3 py-1 text-xs font-medium text-amber-950">Partner</span>}
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

              {/* Contact (official only) */}
              {isOfficial && (
                <div className="space-y-0.5 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">Contact</p>
                  <p className="font-medium text-neutral-900">{form.contact_name || '—'}</p>
                  <p className="text-neutral-500">{form.contact_email || ''}</p>
                  <p className="text-neutral-500">{form.contact_phone || ''}</p>
                </div>
              )}

              {/* Category */}
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <MapPin className="size-3.5 shrink-0 text-neutral-400" />
                <p className="text-sm text-neutral-700">{isOfficial ? 'Official partner venue' : 'Community suggestion'}</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
