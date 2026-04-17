'use client';

import { Loader2, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FEATURE_ACCESS_TEXT } from '@/constants/admin/features/access-control';

interface FeaturesTableHeaderProps {
  isLoading: boolean;
  onCreate: () => void;
  onRefresh: () => void;
}

export function FeaturesTableHeader({ isLoading, onCreate, onRefresh }: FeaturesTableHeaderProps) {
  return (
    <CardHeader className="border-b pb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <CardTitle>Feature registry</CardTitle>
          <CardDescription>Keep slugs, labels, and availability flags aligned with the access-control surface used across the backend.</CardDescription>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
            Refresh
          </Button>
          <Button onClick={onCreate}>
            <Plus className="size-4" />
            {FEATURE_ACCESS_TEXT.addCta}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
