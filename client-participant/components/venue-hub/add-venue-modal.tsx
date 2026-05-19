'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { ModalBackdrop } from './modal-backdrop';
import { AMENITY_OPTIONS } from '@/constants/amenities';
import { VENUE_TYPES } from '@/constants/venue-types';
import { validateAddVenueForm } from '@/lib/validators';
import type { AddVenueFormData } from '@/types';
import type { Amenity } from '@/types/venue';

interface AddVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddVenueFormData) => Promise<void>;
  submitting?: boolean;
}

const INITIAL: AddVenueFormData = {
  name: '',
  address_line: '',
  city: 'Davao City',
  province: 'Davao del Sur',
  capacity: '',
  venue_type: 'indoor',
  amenities: [],
  description: '',
  contact_name: '',
  contact_email: '',
};

const inputCls =
  'border-line-soft bg-page text-text placeholder-text-mute focus:border-lime mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm transition-all focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none';
const labelCls = 'text-text-mute block font-mono text-[10px] tracking-[0.14em] uppercase';
const errorCls = 'text-red-400 mt-1 text-xs';

export function AddVenueModal({ isOpen, onClose, onSubmit, submitting = false }: AddVenueModalProps) {
  const [form, setForm] = useState<AddVenueFormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setField<K extends keyof AddVenueFormData>(key: K, value: AddVenueFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  function toggleAmenity(amenity: Amenity) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateAddVenueForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    await onSubmit(form);
    setForm(INITIAL);
    setErrors({});
  }

  function handleClose() {
    setForm(INITIAL);
    setErrors({});
    onClose();
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={handleClose}>
      <div className="border-line bg-surface flex max-h-[90svh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border shadow-2xl shadow-[oklch(0_0_0_/_0.3)]">
        {/* Header */}
        <div className="border-line-soft flex shrink-0 items-center justify-between border-b px-8 py-6">
          <div>
            <h3 className="text-text m-0 text-xl font-semibold tracking-[-0.02em]">Contribute a venue</h3>
            <p className="text-text-mute mt-0.5 font-mono text-[11px]">Reviewed & verified within 24 hours</p>
          </div>
          <button onClick={handleClose} className="text-text-mute hover:text-text rounded-lg p-2 transition-all hover:bg-[oklch(1_0_0_/_0.06)]">
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-8 py-6">
          {/* Venue name */}
          <div>
            <label className={labelCls}>Venue name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className={inputCls}
              placeholder="e.g., SMX Convention Center"
            />
            {errors.name && <p className={errorCls}>{errors.name}</p>}
          </div>

          {/* Address line */}
          <div>
            <label className={labelCls}>Street address *</label>
            <input
              type="text"
              value={form.address_line}
              onChange={(e) => setField('address_line', e.target.value)}
              className={inputCls}
              placeholder="e.g., J.P. Laurel Ave, Bajada"
            />
            {errors.address_line && <p className={errorCls}>{errors.address_line}</p>}
          </div>

          {/* City + Province */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>City *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
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
                onChange={(e) => setField('province', e.target.value)}
                className={inputCls}
                placeholder="Davao del Sur"
              />
              {errors.province && <p className={errorCls}>{errors.province}</p>}
            </div>
          </div>

          {/* Capacity + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Capacity *</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setField('capacity', e.target.value)}
                className={inputCls}
                placeholder="500"
              />
              {errors.capacity && <p className={errorCls}>{errors.capacity}</p>}
            </div>
            <div>
              <label className={labelCls}>Type *</label>
              <select
                value={form.venue_type}
                onChange={(e) => setField('venue_type', e.target.value as AddVenueFormData['venue_type'])}
                className={inputCls}
              >
                {VENUE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              {errors.venue_type && <p className={errorCls}>{errors.venue_type}</p>}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className={labelCls}>Amenities</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
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
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="Briefly describe this venue…"
            />
          </div>

          {/* Contact info */}
          <div className="border-line-soft rounded-xl border p-4 space-y-3">
            <p className="text-text-mute font-mono text-[10px] tracking-[0.14em] uppercase">Contact info (optional)</p>
            <div>
              <label className={labelCls}>Contact name</label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => setField('contact_name', e.target.value)}
                className={inputCls}
                placeholder="Juan dela Cruz"
              />
            </div>
            <div>
              <label className={labelCls}>Contact email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setField('contact_email', e.target.value)}
                className={inputCls}
                placeholder="juan@example.com"
              />
              {errors.contact_email && <p className={errorCls}>{errors.contact_email}</p>}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-line-soft flex shrink-0 gap-2.5 border-t px-8 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="border-line text-text-dim hover:border-text-mute hover:text-text flex-1 rounded-full border bg-transparent px-4 py-2.5 text-sm font-semibold transition-all hover:bg-[oklch(1_0_0_/_0.04)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-lime flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-10px_var(--lime-glow)] disabled:opacity-50 disabled:translate-y-0"
          >
            {submitting ? 'Submitting…' : 'Submit venue'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
