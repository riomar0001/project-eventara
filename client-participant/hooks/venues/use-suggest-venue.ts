'use client';

import { useState } from 'react';
import type { VenueType, Amenity } from '@/types/venue';
import { validateSuggestVenueForm } from '@/lib/validators';

export type SuggestVenueForm = {
  name: string;
  location: string;
  capacity: string;
  type: VenueType | '';
  amenities: Amenity[];
  description: string;
  contactName: string;
  contactEmail: string;
};

const INITIAL: SuggestVenueForm = {
  name: '',
  location: '',
  capacity: '',
  type: '',
  amenities: [],
  description: '',
  contactName: '',
  contactEmail: ''
};

export function useSuggestVenue() {
  const [form, setForm] = useState<SuggestVenueForm>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function setField<K extends keyof SuggestVenueForm>(key: K, value: SuggestVenueForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  }

  function toggleAmenity(amenity: Amenity) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity) ? prev.amenities.filter((a) => a !== amenity) : [...prev.amenities, amenity]
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateSuggestVenueForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    // TODO: call suggest venue API
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSubmitted(true);
  }

  return { form, errors, submitting, submitted, setField, toggleAmenity, handleSubmit };
}
