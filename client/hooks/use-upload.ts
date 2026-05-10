'use client';

import { useState } from 'react';
import { AccountSettings, Events, Venues } from '@/api/sdk.gen';
import { getAccessToken } from '@/store/auth-store';

export type UploadResourceType = 'event-cover-banner' | 'venue-image' | 'user-profile';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface UploadContext {
  eventId?: string;
  venueId?: string;
}

export interface UploadResult {
  objectKey: string;
  publicUrl: string;
}

interface PresignedUpload {
  upload_url: string;
  object_key: string;
  public_url: string;
}

function extractUploadError(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as { detail?: unknown; message?: unknown };
  if (typeof p.detail === 'string') return p.detail;
  if (Array.isArray(p.detail) && p.detail.length > 0) {
    const first = p.detail[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      const ve = first as { msg?: unknown; message?: unknown };
      if (typeof ve.msg === 'string') return ve.msg;
      if (typeof ve.message === 'string') return ve.message;
    }
  }
  if (typeof p.message === 'string') return p.message;
  return undefined;
}

function parseUploadError(error: unknown): string {
  const extracted = extractUploadError(error);
  if (extracted) return extracted;
  if (error instanceof Error) return error.message;
  return 'Upload failed.';
}

async function requestFeatureUpload(file: File, resourceType: UploadResourceType, context?: UploadContext): Promise<PresignedUpload> {
  const headers = { Authorization: `Bearer ${getAccessToken()}` };

  if (resourceType === 'event-cover-banner') {
    if (!context?.eventId) throw new Error('Save the event before uploading a banner.');
    const result = await Events.uploadEventBannerEventsEventIdBannerPost({
      path: { event_id: context.eventId },
      body: { content_type: file.type },
      headers,
      throwOnError: false
    });
    if (!result.data) throw result.error ?? new Error('Failed to get event banner upload URL.');
    return result.data.upload;
  }

  if (resourceType === 'venue-image') {
    if (!context?.venueId) throw new Error('Save the venue before uploading an image.');
    const result = await Venues.uploadVenueImageVenuesVenueIdImagePost({
      path: { venue_id: context.venueId },
      body: { content_type: file.type },
      headers,
      throwOnError: false
    });
    if (!result.data) throw result.error ?? new Error('Failed to get venue image upload URL.');
    return result.data.upload;
  }

  const result = await AccountSettings.uploadProfileAvatarUserProfileAvatarPatch({
    body: { content_type: file.type },
    headers,
    throwOnError: false
  });
  if (!result.data) throw result.error ?? new Error('Failed to get profile picture upload URL.');
  return result.data.upload;
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File, resourceType: UploadResourceType, context?: UploadContext): Promise<UploadResult> {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed.');
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('File must be under 5 MB.');
    }

    setIsUploading(true);
    try {
      const { upload_url, object_key, public_url } = await requestFeatureUpload(file, resourceType, context);

      const putResp = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!putResp.ok) {
        throw new Error('Upload to storage failed. Please try again.');
      }

      return { objectKey: object_key, publicUrl: public_url };
    } catch (err) {
      throw new Error(parseUploadError(err));
    } finally {
      setIsUploading(false);
    }
  }

  return { upload, isUploading };
}
