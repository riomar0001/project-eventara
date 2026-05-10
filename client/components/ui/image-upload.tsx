'use client';

import { useRef, useState } from 'react';
import { ImageIcon, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type UploadResourceType, useUpload } from '@/hooks/use-upload';

const STORAGE_PUBLIC_URL = (process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL ?? '').replace(/\/$/, '');

function buildPublicUrl(objectKey: string): string {
  return `${STORAGE_PUBLIC_URL}/${objectKey}`;
}

interface ImageUploadProps {
  value?: string | null;
  onChange: (objectKey: string) => void;
  resourceType: UploadResourceType;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, resourceType, className, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useUpload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = previewUrl ?? (value ? buildPublicUrl(value) : null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = '';

    setError(null);
    try {
      const result = await upload(file, resourceType);
      setPreviewUrl(result.publicUrl);
      onChange(result.objectKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    }
  }

  return (
    <div className={className}>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} disabled={disabled || isUploading} />

      {displayUrl ? (
        <div className="relative overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt="Preview" className="h-40 w-full object-cover" />
          {!disabled && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <Button size="sm" variant="secondary" type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {isUploading ? 'Uploading…' : 'Replace'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 transition-colors hover:border-neutral-400 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="size-6 animate-spin text-neutral-400" />
              <span className="text-sm text-neutral-500">Uploading…</span>
            </>
          ) : (
            <>
              <ImageIcon className="size-6 text-neutral-400" />
              <span className="text-sm text-neutral-500">Click to upload image</span>
              <span className="text-xs text-neutral-400">JPEG, PNG, WebP, GIF · max 5 MB</span>
            </>
          )}
        </button>
      )}

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
