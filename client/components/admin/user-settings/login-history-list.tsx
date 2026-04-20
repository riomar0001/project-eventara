'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { Clock3, Globe, LaptopMinimal, MapPin, Smartphone, Tablet, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLoginHistory, type LoginHistoryEntry } from '@/hooks/admin/user-settings/login-history/use-login-history';

function getDeviceLabel(entry: LoginHistoryEntry) {
  const parts = [entry.browser, entry.os].filter(Boolean);
  return parts.length > 0 ? parts.join(' on ') : 'Unknown device';
}

function getLocationLabel(entry: LoginHistoryEntry) {
  const parts = [entry.city, entry.region, entry.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Location unavailable';
}

function DeviceIcon({ deviceType }: { deviceType: string | null }) {
  if (deviceType === 'mobile') return <Smartphone className="size-4" />;
  if (deviceType === 'tablet') return <Tablet className="size-4" />;
  return <LaptopMinimal className="size-4" />;
}

function LoginHistoryRow({ entry }: { entry: LoginHistoryEntry }) {
  const relativeTime = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true });
  const absoluteTime = format(new Date(entry.created_at), 'PPP p');

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-900">
            <DeviceIcon deviceType={entry.device_type} />
            <span>{getDeviceLabel(entry)}</span>
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              {relativeTime}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {getLocationLabel(entry)}
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="size-3.5" />
              {entry.ip_address ?? 'IP unavailable'}
            </span>
          </div>

          <p className="text-muted-foreground text-xs">{absoluteTime}</p>
        </div>

        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          {entry.successful ? 'Successful sign-in' : 'Failed sign-in'}
        </div>
      </div>
    </div>
  );
}

function LoginHistoryLoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border bg-white p-4">
          <div className="h-4 w-48 rounded bg-neutral-200" />
          <div className="mt-3 h-3 w-64 rounded bg-neutral-100" />
          <div className="mt-2 h-3 w-36 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

export function LoginHistoryList() {
  const { entries, error, isEmpty, isLoading } = useLoginHistory();

  if (isLoading) {
    return <LoginHistoryLoadingState />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">Couldn&apos;t load login history</p>
            <p className="mt-1 text-sm text-amber-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-2xl border border-dashed p-5">
        <div className="flex items-start gap-3">
          <Clock3 className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-sm font-medium">No login history yet</p>
            <p className="text-muted-foreground mt-2 text-sm">Your recent successful sign-ins will appear here after you log in.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="space-y-3">
        {entries.map((entry) => (
          <LoginHistoryRow key={entry.id} entry={entry} />
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" disabled>
          Showing latest {entries.length} entries
        </Button>
      </div>
    </div>
  );
}
