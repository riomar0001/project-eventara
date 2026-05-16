'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="text-muted-foreground size-8 animate-spin" />
    </div>
  );
}

export function LoadingSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="w-full rounded-lg" style={{ height }} />
      </CardContent>
    </Card>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-center text-sm">{message}</p>
      </CardContent>
    </Card>
  );
}

type KpiCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sublabel: string;
};

export function KpiCard({ icon: Icon, label, value, sublabel }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lime-50">
          <Icon className="size-5 text-lime-600" />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-xs">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-muted-foreground truncate text-xs">{sublabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <Skeleton className="size-11 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}
