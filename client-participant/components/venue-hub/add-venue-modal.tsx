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
      <div className="w-full max-w-lg rounded-3xl border border-line bg-surface shadow-2xl shadow-[oklch(0_0_0_/_0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line-soft px-8 py-6">
          <h3 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-text">{isEditing ? 'Edit venue' : 'Add a new venue'}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-text-mute transition-all hover:bg-[oklch(1_0_0_/_0.06)] hover:text-text">
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-8 py-6">
          {/* Name */}
          <div>
            <label className="block font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Venue name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-line-soft bg-page px-3 py-2.5 text-text placeholder-text-mute transition-all focus:border--lime focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
              placeholder="e.g., SMX Convention Center"
            />
            {errors.name && <p className="mt-1 text-xs text--red">{errors.name}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="block font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-line-soft bg-page px-3 py-2.5 text-text placeholder-text-mute transition-all focus:border--lime focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
              placeholder="e.g., Lanang, Davao City"
            />
            {errors.location && <p className="mt-1 text-xs text--red">{errors.location}</p>}
          </div>

          {/* Capacity & Type (2-col) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Capacity</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-line-soft bg-page px-3 py-2.5 text-text placeholder-text-mute transition-all focus:border--lime focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
                placeholder="500"
              />
              {errors.capacity && <p className="mt-1 text-xs text--red">{errors.capacity}</p>}
            </div>

            <div>
              <label className="block font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-line-soft bg-page px-3 py-2.5 text-text transition-all focus:border--lime focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
              >
                {VENUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.type && <p className="mt-1 text-xs text--red">{errors.type}</p>}
            </div>
          </div>

          {/* Amenities Grid */}
          <div>
            <label className="block font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Amenities</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {AMENITY_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleAmenityToggle(option.key)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    formData.amenities.includes(option.key as Amenity)
                      ? 'border--lime bg-[oklch(0.9_0.22_128_/_0.06)] text-lime'
                      : 'border-line-soft bg-transparent text-text-dim hover:border--text-mute hover:text-text'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Additional notes (optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-line-soft bg-page px-3 py-2.5 text-text placeholder-text-mute transition-all focus:border--lime focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
              placeholder="Any other details about this venue..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-2.5 border-t border-line-soft px-8 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-line bg-transparent px-4 py-2.5 font-semibold text-text-dim transition-all hover:border--text-mute hover:bg-[oklch(1_0_0_/_0.04)] hover:text-text"
          >
            Cancel
          </button>
          <button
            onClick={(e) => handleSubmit(e as React.MouseEvent<HTMLButtonElement>)}
            className="flex-1 rounded-full bg-lime px-4 py-2.5 font-semibold text-[#0a1005] transition-all hover:-translate-y-0.5 hover:shadow-lime-glow hover:shadow-lg"
            style={{
              boxShadow: '0 8px 28px -10px var(--lime-glow), inset 0 -1px 0 oklch(0.7 0.2 128)'
            }}
          >
            {isEditing ? 'Update venue' : 'Add venue'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
