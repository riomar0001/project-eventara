import { PotentialVolunteersTableContent } from '@/components/admin/volunteers/table/potential-volunteers-table';
import { BackLink } from '@/components/admin/volunteers/volunteers-shared';
import { PermissionGate } from '@/components/auth/permission-gate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

export default function AdminPotentialVolunteersPage() {
  return (
    <PermissionGate feature="volunteers" action="read">
      <div className="space-y-6">
        <BackLink href={ADMIN_OPERATIONS_PATHS.volunteers} label="Back to volunteers" />

        <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
          <CardHeader className="border-b border-neutral-200/80">
            <div className="space-y-1">
              <CardTitle>Potential volunteers</CardTitle>
              <CardDescription>Community members who already show up in the orbit around volunteering and can be moved into the active roster.</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <PotentialVolunteersTableContent />
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}