'use client';

import { useState } from 'react';
import { VolunteerRoleForm } from '@/components/admin/volunteers/volunteer-role-form';
import { VolunteerRolesTable } from '@/components/admin/volunteers/table/volunteer-roles-table';
import { BackLink } from '@/components/admin/volunteers/volunteers-shared';
import { Card, CardContent } from '@/components/ui/card';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

export default function AdminVolunteerRolesPage() {
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="space-y-6">
      <BackLink href={ADMIN_OPERATIONS_PATHS.volunteers} label="Back to volunteers" />

      <VolunteerRoleForm onCreated={() => setRefreshSignal((s) => s + 1)} />

      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardContent className="p-0">
          <VolunteerRolesTable refreshSignal={refreshSignal} />
        </CardContent>
      </Card>
    </div>
  );
}
