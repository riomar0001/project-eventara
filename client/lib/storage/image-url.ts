const STORAGE_PUBLIC_URL = (process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL ?? '').replace(/\/$/, '');

export function resolveStorageImageUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('blob:')) return value;
  if (!STORAGE_PUBLIC_URL) return value;
  return `${STORAGE_PUBLIC_URL}/${value.replace(/^\//, '')}`;
}
