'use client';

import { Loader2, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_ACCESS_TEXT } from '@/constants/admin/roles/access-control';

interface RolesTableHeaderProps {
  isLoading: boolean;
  onCreate: () => void;
  onRefresh: () => void;
}

export function RolesTableHeader({ isLoading, onCreate, onRefresh }: RolesTableHeaderProps) {
  return (
    <CardHeader className="border-b pb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <CardTitle>Role catalog</CardTitle>
          <CardDescription>Bundle reusable permissions across multiple access features, actions, and allow or deny effects.</CardDescription>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
            Refresh
          </Button>
          <Button onClick={onCreate}>
            <Plus className="size-4" />
            {ROLE_ACCESS_TEXT.addCta}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
