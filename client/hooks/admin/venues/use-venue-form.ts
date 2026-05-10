'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Venues } from '@/api/sdk.gen';
import { getAccessToken } from '@/store/auth-store';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { useUpload } from '@/hooks/use-upload';
import type { VenueFormValues } from '@/components/admin/venues/venue-form';

function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as { detail?: unknown; message?: unknown };
  if (typeof p.detail === 'string') return p.detail;
  if (Array.isArray(p.detail) && p.detail.length > 0) {
    const first = p.detail[0];
    if (first && typeof first === 'object') {
      const ve = first as { msg?: unknown; message?: unknown };
      if (typeof ve.msg === 'string') return ve.msg;
      if (typeof ve.message === 'string') return ve.message;
    }
    if (typeof first === 'string') return first;
  }
  if (typeof p.message === 'string') return p.message;
  return undefined;
}

function getVenueErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const d = (error as { response?: { data?: unknown } }).response?.data;
    const msg = extractErrorMessage(d) ?? extractErrorMessage(error);
    if (msg) return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function useVenueForm() {
  const router = useRouter();
  const { upload, isUploading } = useUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function buildVenueBody(form: VenueFormValues, imageFile?: File | null) {
    return {
      name: form.name,
      description: form.description || null,
      image_url: imageFile ? null : form.image_url || null,
      address_line: form.address_line,
      city: form.city,
      province: form.province,
      postal_code: form.postal_code,
      region: form.region,
      country: form.country,
      capacity: Number(form.capacity),
      venue_type: form.venue_type,
      amenities: form.amenities.length > 0 ? form.amenities : null
    };
  }

  async function submitCreate(form: VenueFormValues, imageFile?: File | null) {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const baseBody = buildVenueBody(form, imageFile);

    try {
      let venueId: string;

      if (form.venue_category === 'community') {
        const result = await Venues.createCommunityVenueVenuesCommunityPost({
          body: {
            ...baseBody,
            contact_name: form.contact_name,
            contact_phone: form.contact_phone,
            contact_email: form.contact_email
          },
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          throwOnError: false
        });
        if (!result.data) throw result.error ?? new Error('Unable to add venue.');
        venueId = result.data.data.id;
      } else {
        const result = await Venues.createOfficialVenueVenuesOfficialPost({
          body: {
            ...baseBody,
            contact_name: form.contact_name,
            contact_phone: form.contact_phone,
            contact_email: form.contact_email
          },
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          throwOnError: false
        });
        if (!result.data) throw result.error ?? new Error('Unable to add venue.');
        venueId = result.data.data.id;
      }

      if (imageFile) {
        await upload(imageFile, 'venue-image', { venueId });
      }

      toast.success(form.venue_category === 'community' ? 'Community venue added successfully.' : 'Official venue created successfully.');
      router.push(ADMIN_OPERATIONS_PATHS.venueDetail(venueId));
    } catch (error) {
      toast.error(getVenueErrorMessage(error, 'Unable to save venue. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitEdit(venueId: string, form: VenueFormValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await Venues.updateVenueVenuesVenueIdPatch({
        path: { venue_id: venueId },
        body: {
          ...buildVenueBody(form),
          is_partner: form.venue_category === 'official',
          contact_name: form.contact_name || '',
          contact_phone: form.contact_phone || '',
          contact_email: form.contact_email || ''
        },
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (!result.data) throw result.error ?? new Error('Unable to update venue.');

      toast.success(result.data.message ?? 'Venue updated successfully.');
      router.push(ADMIN_OPERATIONS_PATHS.venueDetail(venueId));
    } catch (error) {
      toast.error(getVenueErrorMessage(error, 'Unable to update venue. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return { submitCreate, submitEdit, isSubmitting: isSubmitting || isUploading };
}
