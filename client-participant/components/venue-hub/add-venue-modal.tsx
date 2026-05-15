/**
 * Add/Edit Venue Modal
 */

'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import type { Venue, VenueType, Amenity } from '@/types/venue';
import { ModalBackdrop } from './modal-backdrop';
import { AMENITY_OPTIONS } from '@/constants/amenities';
import { VENUE_TYPES } from '@/constants/venue-types';
import { validateAddVenueForm } from '@/lib/validators';
import type { AddVenueFormData } from '@/types';

interface AddVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddVenueFormData) => void;
  initialVenue?: Venue;
  isEditing?: boolean;
}

export function AddVenueModal({ isOpen, onClose, onSubmit, initialVenue, isEditing = false }: AddVenueModalProps) {
  const [formData, setFormData] = useState<AddVenueFormData>({
    name: initialVenue?.name || '',
    location: initialVenue?.location || '',
    capacity: initialVenue?.capacity.toString() || '',
    type: initialVenue?.type || (VENUE_TYPES[0] as VenueType),
    amenities: initialVenue?.amenities || [],
    notes: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? value : value
    }));
  };

  const handleAmenityToggle = (amenity: Amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity) ? prev.amenities.filter((a) => a !== amenity) : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateAddVenueForm(formData);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
    setFormData({
      name: '',
      location: '',
      capacity: '',
      type: VENUE_TYPES[0] as VenueType,
      amenities: [],
      notes: ''
    });
    setErrors({});
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="border-line bg-surface w-full max-w-lg rounded-3xl border shadow-2xl shadow-[oklch(0_0_0_/_0.3)]">
        {/* Header */}
        <div className="border-line-soft flex items-center justify-between border-b px-8 py-6">
          <h3 className="text-text m-0 text-2xl font-semibold tracking-[-0.02em]">{isEditing ? 'Edit venue' : 'Add a new venue'}</h3>
          <button onClick={onClose} className="text-text-mute hover:text-text rounded-lg p-2 transition-all hover:bg-[oklch(1_0_0_/_0.06)]">
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-8 py-6">
          {/* Name */}
          <div>
            <label className="text-text-mute block font-mono text-xs tracking-[0.14em] uppercase">Venue name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="border-line-soft bg-page text-text placeholder-text-mute focus:border-lime mt-1.5 w-full rounded-lg border px-3 py-2.5 transition-all focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
              placeholder="e.g., SMX Convention Center"
            />
            {errors.name && <p className="text-red mt-1 text-xs">{errors.name}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="text-text-mute block font-mono text-xs tracking-[0.14em] uppercase">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="border-line-soft bg-page text-text placeholder-text-mute focus:border-lime mt-1.5 w-full rounded-lg border px-3 py-2.5 transition-all focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
              placeholder="e.g., Lanang, Davao City"
            />
            {errors.location && <p className="text-red mt-1 text-xs">{errors.location}</p>}
          </div>

          {/* Capacity & Type (2-col) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-mute block font-mono text-xs tracking-[0.14em] uppercase">Capacity</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="border-line-soft bg-page text-text placeholder-text-mute focus:border-lime mt-1.5 w-full rounded-lg border px-3 py-2.5 transition-all focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
                placeholder="500"
              />
              {errors.capacity && <p className="text-red mt-1 text-xs">{errors.capacity}</p>}
            </div>

            <div>
              <label className="text-text-mute block font-mono text-xs tracking-[0.14em] uppercase">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="border-line-soft bg-page text-text focus:border-lime mt-1.5 w-full rounded-lg border px-3 py-2.5 transition-all focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
              >
                {VENUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-red mt-1 text-xs">{errors.type}</p>}
            </div>
          </div>

          {/* Amenities Grid */}
          <div>
            <label className="text-text-mute block font-mono text-xs tracking-[0.14em] uppercase">Amenities</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {AMENITY_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleAmenityToggle(option.key)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    formData.amenities.includes(option.key as Amenity)
                      ? 'border-lime text-lime bg-[oklch(0.9_0.22_128_/_0.06)]'
                      : 'border-line-soft text-text-dim hover:border-text-mute hover:text-text bg-transparent'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-text-mute block font-mono text-xs tracking-[0.14em] uppercase">Additional notes (optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="border-line-soft bg-page text-text placeholder-text-mute focus:border-lime mt-1.5 w-full rounded-lg border px-3 py-2.5 transition-all focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
              placeholder="Any other details about this venue..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="border-line-soft flex gap-2.5 border-t px-8 py-4">
          <button
            onClick={onClose}
            className="border-line text-text-dim hover:border-text-mute hover:text-text flex-1 rounded-full border bg-transparent px-4 py-2.5 font-semibold transition-all hover:bg-[oklch(1_0_0_/_0.04)]"
          >
            Cancel
          </button>
          <button
            onClick={(e) => handleSubmit(e as React.MouseEvent<HTMLButtonElement>)}
            className="bg-lime flex-1 rounded-full px-4 py-2.5 font-semibold text-white shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-10px_var(--lime-glow)]"
          >
            {isEditing ? 'Update venue' : 'Add venue'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
