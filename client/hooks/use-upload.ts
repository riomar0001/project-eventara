'use client';

import { useState } from 'react';
import { getAccessToken } from '@/store/auth-store';

export type UploadResourceType = 'event-cover-banner' | 'registration-uploads' | 'user-profile';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export interface UploadResult {
  objectKey: string;
  publicUrl: string;
}

function parseUploadError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Upload failed.';
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File, resourceType: UploadResourceType): Promise<UploadResult> {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed.');
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('File must be under 5 MB.');
    }

    setIsUploading(true);
    try {
      const presignResp = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({ resource_type: resourceType, content_type: file.type })
      });

      const body = await presignResp.json().catch(() => null);
      if (!presignResp.ok) {
        throw new Error(body?.message ?? body?.detail ?? 'Failed to get upload URL.');
      }

      const { upload_url, object_key, public_url } = body.data as {
        upload_url: string;
        object_key: string;
        public_url: string;
      };

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
