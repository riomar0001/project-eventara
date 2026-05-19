'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ImageIcon, Loader2, MapPin, Upload, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Venues } from '@/api';
import { useAuthStore } from '@/store/auth-store';
import { humanizeApiError } from '@/lib/api-error';
import { AMENITY_OPTIONS } from '@/constants/amenities';
import type { Amenity } from '@/types/venue';

// ── Types ────────────────────────────────────────────────────────────────────

type VenueTypeOption = 'indoor' | 'outdoor' | 'hybrid';

interface FormValues {
  name: string;
  description: string;
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  region: string;
  country: string;
  capacity: string;
  venue_type: VenueTypeOption;
  amenities: Amenity[];
  contact_name: string;
  contact_phone: string;
  contact_email: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

interface ExistingVenue {
  name: string;
  description: string | null;
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  region: string;
  country: string;
  capacity: number;
  venue_type: VenueTypeOption;
  amenities: string[] | null;
  image_url: string | null;
}

interface ContributeVenueFormProps {
  /** When provided the form operates in edit mode (PATCH). */
  venueId?: string;
  existingVenue?: ExistingVenue;
}

const INITIAL: FormValues = {
  name: '',
  description: '',
  address_line: '',
  city: 'Davao City',
  province: 'Davao del Sur',
  postal_code: '8000',
  region: 'Region XI',
  country: 'Philippines',
  capacity: '',
  venue_type: 'indoor',
  amenities: [],
  contact_name: '',
  contact_phone: '',
  contact_email: '',
};

function venueToForm(v: ExistingVenue): FormValues {
  return {
    name: v.name,
    description: v.description ?? '',
    address_line: v.address_line,
    city: v.city,
    province: v.province,
    postal_code: v.postal_code,
    region: v.region,
    country: v.country,
    capacity: String(v.capacity),
    venue_type: v.venue_type,
    amenities: (v.amenities ?? []) as Amenity[],
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  };
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE = 5 * 1024 * 1024;

// ── Validation ───────────────────────────────────────────────────────────────

function validate(data: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = 'Please enter a venue name.';
  if (!data.address_line.trim()) errors.address_line = 'Please enter the street address.';
  if (!data.city.trim()) errors.city = 'Please enter the city.';
  if (!data.province.trim()) errors.province = 'Please enter the province.';
  const cap = parseInt(data.capacity);
  if (!data.capacity || isNaN(cap) || cap <= 0) errors.capacity = 'Capacity must be at least 1.';
  else if (cap > 1_000_000) errors.capacity = 'Capacity cannot exceed 1,000,000.';
  if (data.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)) {
    errors.contact_email = 'Please enter a valid email address.';
  }
  return errors;
}

// ── Shared style tokens ───────────────────────────────────────────────────────

const inputCls =
  'border-line-soft bg-page text-text placeholder-text-mute focus:border-lime w-full rounded-lg border px-3 py-2.5 text-sm transition-all focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none';
const labelCls = 'text-text-mute block font-mono text-[10px] tracking-[0.14em] uppercase mb-1.5';
const errorCls = 'text-red-400 mt-1 text-xs';
const sectionTitleCls = 'text-text-mute font-mono text-[10px] tracking-[0.18em] uppercase font-semibold';
const fieldsetCls = 'border-line-soft rounded-2xl border p-5 space-y-4';

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <p className={sectionTitleCls}>{children}</p>
      <div className="border-line-soft flex-1 border-t" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ContributeVenueForm({ venueId, existingVenue }: ContributeVenueFormProps = {}) {
  const isEditMode = Boolean(venueId);
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [form, setForm] = useState<FormValues>(() => existingVenue ? venueToForm(existingVenue) : INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(existingVenue?.image_url ?? null);
  const [imageFileError, setImageFileError] = useState<string | null>(null);

  // Amenities
  const amenityDraftRef = useRef<HTMLInputElement>(null);
  const [amenityDraft, setAmenityDraft] = useState('');

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewBlobUrl?.startsWith('blob:')) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      setImageFileError('Only JPEG, PNG, WebP, and GIF images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setImageFileError('Image must be under 5 MB.');
      return;
    }

    setImageFileError(null);
    if (previewBlobUrl?.startsWith('blob:')) URL.revokeObjectURL(previewBlobUrl);
    const blobUrl = URL.createObjectURL(file);
    setPreviewBlobUrl(blobUrl);
    setPendingImageFile(file);
  }

  function clearImage() {
    if (previewBlobUrl?.startsWith('blob:')) URL.revokeObjectURL(previewBlobUrl);
    setPreviewBlobUrl(null);
    setPendingImageFile(null);
    setExistingImageUrl(null);
    setImageFileError(null);
  }

  function toggleAmenity(amenity: Amenity) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }

  function addFreeAmenity(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.map((a) => a.toLowerCase()).includes(trimmed.toLowerCase())
        ? prev.amenities
        : [...prev.amenities as string[], trimmed] as Amenity[],
    }));
    setAmenityDraft('');
  }

  function removeFreeAmenity(a: Amenity) {
    const preset = AMENITY_OPTIONS.map((o) => o.key);
    if (preset.includes(a)) return;
    setForm((prev) => ({ ...prev, amenities: prev.amenities.filter((x) => x !== a) }));
  }

  function handleAmenityKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addFreeAmenity(amenityDraft); }
    else if (e.key === 'Backspace' && amenityDraft === '') {
      const extra = form.amenities.filter((a) => !AMENITY_OPTIONS.map((o) => o.key).includes(a));
      if (extra.length > 0) removeFreeAmenity(extra[extra.length - 1] as Amenity);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (!accessToken) {
      setSubmitError('You must be signed in to contribute a venue.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    if (isEditMode && venueId) {
      // ── Edit mode: upload image first (if new), then PATCH ────────────────
      let imageUrl: string | null = existingImageUrl;

      if (pendingImageFile) {
        try {
          const { data: uploadData } = await Venues.uploadVenueImageVenuesVenueIdImagePost({
            path: { venue_id: venueId },
            body: { content_type: pendingImageFile.type },
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (uploadData?.upload?.upload_url) {
            await fetch(uploadData.upload.upload_url, {
              method: 'PUT',
              headers: { 'Content-Type': pendingImageFile.type },
              body: pendingImageFile,
            });
            imageUrl = uploadData.upload.public_url;
          }
        } catch {
          // Image upload failure is non-fatal — venue fields will still be saved
        }
      }

      const { error: patchError } = await Venues.updateSuggestedVenueVenuesCommunityVenueIdPatch({
        path: { venue_id: venueId },
        body: {
          name: form.name,
          description: form.description || null,
          image_url: imageUrl,
          address_line: form.address_line,
          city: form.city,
          province: form.province,
          postal_code: form.postal_code || '8000',
          region: form.region || 'Region XI',
          country: form.country || 'Philippines',
          capacity: parseInt(form.capacity, 10),
          venue_type: form.venue_type,
          amenities: form.amenities,
          contact_name: form.contact_name || null,
          contact_phone: form.contact_phone || null,
          contact_email: form.contact_email || null,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setSubmitting(false);
      if (patchError) {
        setSubmitError(humanizeApiError((patchError as { message?: string })?.message, 'Failed to update venue. Please try again.'));
        return;
      }
      router.push('/venues?updated=1');
      return;
    }

    // ── Create mode: create venue, then upload image ───────────────────────
    const { data: createData, error: createError } = await Venues.createCommunityVenueVenuesCommunityPost({
      body: {
        name: form.name,
        description: form.description || null,
        image_url: null,
        address_line: form.address_line,
        city: form.city,
        province: form.province,
        postal_code: form.postal_code || '8000',
        region: form.region || 'Region XI',
        country: form.country || 'Philippines',
        capacity: parseInt(form.capacity, 10),
        venue_type: form.venue_type,
        amenities: form.amenities,
        contact_name: form.contact_name || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (createError || !createData) {
      setSubmitting(false);
      setSubmitError(humanizeApiError((createError as { message?: string })?.message, 'Failed to submit venue. Please try again.'));
      return;
    }

    const newVenueId = createData.data.id;

    // Upload image if one was selected (best-effort; venue is already saved)
    if (pendingImageFile) {
      try {
        const { data: uploadData } = await Venues.uploadVenueImageVenuesVenueIdImagePost({
          path: { venue_id: newVenueId },
          body: { content_type: pendingImageFile.type },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (uploadData?.upload?.upload_url) {
          await fetch(uploadData.upload.upload_url, {
            method: 'PUT',
            headers: { 'Content-Type': pendingImageFile.type },
            body: pendingImageFile,
          });
        }
      } catch {
        // Image upload failure is non-fatal — venue is already created
      }
    }

    setSubmitting(false);
    router.push('/venues?contributed=1');
  }

  const presetAmenityKeys = AMENITY_OPTIONS.map((o) => o.key);
  const extraAmenities = form.amenities.filter((a) => !presetAmenityKeys.includes(a));

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-8 md:py-12">
      {/* Back link */}
      <Link
        href="/venues"
        className="text-text-mute hover:text-text mb-8 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors"
      >
        <ArrowLeft size={14} />
        Back to venues
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <div className="text-text-mute mb-2 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase">
          <span className="bg-lime inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_8px_var(--lime-glow)]" />
          {isEditMode ? 'Edit submission' : 'Community contribution'}
        </div>
        <h1 className="text-text m-0 text-3xl font-bold tracking-[-0.03em]">
          {isEditMode ? 'Edit venue' : 'Contribute a venue'}
        </h1>
        <p className="text-text-dim mt-1.5 text-sm leading-relaxed">
          {isEditMode
            ? 'Update the details below. Your changes will be reflected immediately.'
            : 'Fill in the details below and a contributor will review it within 24 hours. Fields marked * are required.'}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* ── Left: Form ───────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Basic information */}
          <div className={fieldsetCls}>
            <SectionTitle>Basic information</SectionTitle>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Venue name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. SMX Convention Center"
                  maxLength={255}
                />
                {errors.name && <p className={errorCls}>{errors.name}</p>}
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={3}
                  className={inputCls}
                  placeholder="Describe the space, its best use, and anything notable…"
                  maxLength={1000}
                />
                <p className="text-text-mute mt-1 text-right font-mono text-[10px]">{form.description.length} / 1000</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Venue type *</label>
                  <select
                    value={form.venue_type}
                    onChange={(e) => set('venue_type', e.target.value as VenueTypeOption)}
                    className={inputCls}
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Capacity *</label>
                  <input
                    type="number"
                    min={1}
                    max={1_000_000}
                    value={form.capacity}
                    onChange={(e) => set('capacity', e.target.value)}
                    className={inputCls}
                    placeholder="500"
                  />
                  {errors.capacity && <p className={errorCls}>{errors.capacity}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Venue image */}
          <div className={fieldsetCls}>
            <SectionTitle>Venue image</SectionTitle>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileSelect}
              disabled={submitting}
            />

            {/* 16:9 upload area */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              {previewBlobUrl || existingImageUrl ? (
                <>
                  <Image
                    src={previewBlobUrl ?? existingImageUrl!}
                    alt="Venue preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Hover overlay — replace or clear */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={submitting}
                      className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                    >
                      <Upload size={12} />
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={clearImage}
                      disabled={submitting}
                      className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                    >
                      <X size={12} />
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  className="border-line-soft bg-page absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors hover:border-[oklch(0.6_0_0)] hover:bg-[oklch(1_0_0_/_0.02)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="absolute top-3 right-3 font-mono text-[10px] font-semibold tracking-[0.14em] text-[oklch(0.5_0_0)] select-none">
                    16 : 9
                  </span>
                  <ImageIcon size={26} className="text-text-mute opacity-50" />
                  <span className="text-sm font-medium text-[oklch(0.6_0_0)]">Click to upload image</span>
                  <span className="font-mono text-[10px] text-[oklch(0.5_0_0)]">JPEG, PNG, WebP, GIF · max 5 MB</span>
                </button>
              )}
            </div>

            {imageFileError && <p className={errorCls}>{imageFileError}</p>}
            <p className="text-text-mute font-mono text-[10px]">
              Use a 16:9 photo for the best result (e.g. 1280 × 720 px). Optional.
            </p>
          </div>

          {/* Address */}
          <div className={fieldsetCls}>
            <SectionTitle>Address</SectionTitle>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Street address *</label>
                <input
                  type="text"
                  value={form.address_line}
                  onChange={(e) => set('address_line', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. J.P. Laurel Ave, Bajada"
                  maxLength={255}
                />
                {errors.address_line && <p className={errorCls}>{errors.address_line}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>City *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    className={inputCls}
                    placeholder="Davao City"
                  />
                  {errors.city && <p className={errorCls}>{errors.city}</p>}
                </div>
                <div>
                  <label className={labelCls}>Province *</label>
                  <input
                    type="text"
                    value={form.province}
                    onChange={(e) => set('province', e.target.value)}
                    className={inputCls}
                    placeholder="Davao del Sur"
                  />
                  {errors.province && <p className={errorCls}>{errors.province}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Postal code</label>
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={(e) => set('postal_code', e.target.value)}
                    className={inputCls}
                    placeholder="8000"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className={labelCls}>Region</label>
                  <input
                    type="text"
                    value={form.region}
                    onChange={(e) => set('region', e.target.value)}
                    className={inputCls}
                    placeholder="Region XI"
                    maxLength={100}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => set('country', e.target.value)}
                  className={inputCls}
                  placeholder="Philippines"
                  maxLength={100}
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className={fieldsetCls}>
            <SectionTitle>Amenities</SectionTitle>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {AMENITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggleAmenity(opt.key as Amenity)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                      form.amenities.includes(opt.key as Amenity)
                        ? 'border-lime text-lime bg-[oklch(0.9_0.22_128_/_0.06)]'
                        : 'border-line-soft text-text-dim hover:border-text-mute hover:text-text bg-transparent'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div>
                <label className={labelCls}>Add custom amenities</label>
                <div
                  className="border-line-soft bg-page flex min-h-[42px] cursor-text flex-wrap gap-2 rounded-lg border px-3 py-2"
                  onClick={() => amenityDraftRef.current?.focus()}
                >
                  {extraAmenities.map((a) => (
                    <span
                      key={a}
                      className="border-line-soft text-text-dim inline-flex items-center gap-1 rounded-full border bg-transparent px-2.5 py-0.5 text-xs font-medium"
                    >
                      {a}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFreeAmenity(a as Amenity); }}
                        className="text-text-mute hover:text-text ml-0.5"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={amenityDraftRef}
                    type="text"
                    value={amenityDraft}
                    onChange={(e) => setAmenityDraft(e.target.value)}
                    onKeyDown={handleAmenityKeyDown}
                    onBlur={() => addFreeAmenity(amenityDraft)}
                    placeholder={extraAmenities.length === 0 ? 'Type and press Enter…' : ''}
                    className="text-text min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
                  />
                </div>
                <p className="text-text-mute mt-1.5 font-mono text-[10px]">Press Enter to add. Backspace removes the last custom tag.</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className={fieldsetCls}>
            <SectionTitle>Contact info (optional)</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Contact name</label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={(e) => set('contact_name', e.target.value)}
                  className={inputCls}
                  placeholder="Juan dela Cruz"
                  maxLength={255}
                />
              </div>
              <div>
                <label className={labelCls}>Mobile number</label>
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) => set('contact_phone', e.target.value)}
                  className={inputCls}
                  placeholder="+63 912 345 6789"
                  maxLength={20}
                />
              </div>
              <div>
                <label className={labelCls}>Email address</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => set('contact_email', e.target.value)}
                  className={inputCls}
                  placeholder="juan@example.com"
                  maxLength={255}
                />
                {errors.contact_email && <p className={errorCls}>{errors.contact_email}</p>}
              </div>
            </div>
          </div>

          {/* Actions */}
          {submitError && (
            <p className="border border-red-500/20 bg-red-500/10 rounded-xl px-4 py-3 text-red-400 text-sm">{submitError}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="border-line text-text-dim hover:border-text-mute hover:text-text rounded-full border bg-transparent px-6 py-2.5 text-sm font-semibold transition-all hover:bg-[oklch(1_0_0_/_0.04)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-lime inline-flex items-center gap-2 rounded-full px-8 py-2.5 text-sm font-semibold text-white shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-10px_var(--lime-glow)] disabled:translate-y-0 disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {isEditMode
                ? (submitting ? 'Saving…' : 'Save changes')
                : (submitting ? 'Submitting…' : 'Submit venue')}
            </button>
          </div>
        </form>

        {/* ── Right: Live preview ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="border-line bg-surface sticky top-6 overflow-hidden rounded-2xl border">
            {/* 16:9 image with name overlay */}
            <div className="relative aspect-video w-full overflow-hidden">
              {previewBlobUrl || existingImageUrl ? (
                <Image
                  src={previewBlobUrl ?? existingImageUrl!}
                  alt="Venue preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="bg-page absolute inset-0 flex items-center justify-center">
                  <ImageIcon size={36} className="text-text-mute opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-mono text-[10px] tracking-[0.16em] text-white/60 uppercase">
                  {[form.city, form.province].filter(Boolean).join(', ') || 'City, Province'}
                </p>
                <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-white">
                  {form.name || 'Untitled venue'}
                </h2>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="border-line-soft rounded-xl border px-4 py-3">
                <p className="text-text-mute mb-1 font-mono text-[10px] tracking-[0.14em] uppercase">Address</p>
                <p className="text-text text-sm font-medium">
                  {[form.address_line, form.city, form.province, form.postal_code, form.country].filter(Boolean).join(', ') || '—'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border-line-soft rounded-xl border px-4 py-3">
                  <p className="text-text-mute mb-0.5 font-mono text-[10px] tracking-[0.14em] uppercase">Capacity</p>
                  <p className="text-text text-sm font-medium">
                    {form.capacity ? `${Number(form.capacity).toLocaleString()} guests` : '—'}
                  </p>
                </div>
                <div className="border-line-soft rounded-xl border px-4 py-3">
                  <p className="text-text-mute mb-0.5 font-mono text-[10px] tracking-[0.14em] uppercase">Type</p>
                  <p className="text-text text-sm font-medium capitalize">{form.venue_type}</p>
                </div>
              </div>

              <div className="border-line-soft rounded-xl border px-4 py-3">
                <p className="text-text-mute mb-2 font-mono text-[10px] tracking-[0.14em] uppercase">Amenities</p>
                {form.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {form.amenities.map((a) => (
                      <span key={a} className="border-line-soft text-text-dim rounded-full border px-2.5 py-0.5 font-mono text-[10px]">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-mute font-mono text-[11px]">None selected.</p>
                )}
              </div>

              {(form.contact_name || form.contact_phone || form.contact_email) && (
                <div className="border-line-soft rounded-xl border px-4 py-3">
                  <p className="text-text-mute mb-1 font-mono text-[10px] tracking-[0.14em] uppercase">Contact</p>
                  {form.contact_name && <p className="text-text text-sm font-medium">{form.contact_name}</p>}
                  {form.contact_phone && <p className="text-text-mute text-sm">{form.contact_phone}</p>}
                  {form.contact_email && <p className="text-text-mute text-sm">{form.contact_email}</p>}
                </div>
              )}

              <div className="border-line-soft flex items-center gap-2 rounded-xl border px-4 py-3">
                <MapPin size={13} className="text-text-mute shrink-0" />
                <p className="text-text-mute text-sm">
                  {isEditMode ? 'Community suggestion · editing' : 'Community suggestion · pending review'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
