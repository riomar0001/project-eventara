'use client';

import { useState } from 'react';
import { Layers3, Plus, RefreshCw, Tags } from 'lucide-react';
import { VolunteerRolesTable } from '@/components/admin/volunteers/table/volunteer-roles-table';
import { VolunteerRoleForm } from '@/components/admin/volunteers/volunteer-role-form';
import { BackLink, OperationsPageIntro } from '@/components/admin/volunteers/volunteers-shared';
import { PermissionGate } from '@/components/auth/permission-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

export default function AdminVolunteerRolesPage() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <PermissionGate feature="volunteers" action="read">
      <div className="space-y-6">
        <BackLink href={ADMIN_OPERATIONS_PATHS.volunteers} label="Back to volunteers" />

        <OperationsPageIntro
          eyebrow="Role Catalog"
          title="Volunteer roles"
          description="Keep assignment labels clean and reusable so event teams can staff shifts without inventing role names every time."
          tone="emerald"
          metrics={[
            {
              label: 'Create flow',
              value: 'Modal',
              hint: 'Add a role without leaving the catalog.'
            },
            {
              label: 'Catalog view',
              value: '20/page',
              hint: 'Searchable and filterable role inventory.'
            },
            {
              label: 'States',
              value: '2',
              hint: 'Active and inactive role visibility.'
            }
          ]}
          actions={
            <div className="w-full max-w-[18rem] rounded-[24px] border border-emerald-300/55 bg-white/76 p-3.5 text-stone-950 shadow-[0_18px_55px_-32px_rgba(6,95,70,0.32)] backdrop-blur-sm xl:max-w-76">
              <p className="text-[10px] font-semibold tracking-[0.24em] text-emerald-800 uppercase">Catalog Action</p>
              <p className="mt-1 text-[13px] leading-5 text-stone-600">Add a reusable role and return directly to the filtered list.</p>
              <Button
                size="lg"
                className="mt-3 h-11 w-full rounded-xl border-0 bg-emerald-600 font-semibold text-white shadow-[0_14px_35px_-18px_rgba(15,23,42,0.45)] hover:bg-emerald-500"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="size-4" />
                Create role
              </Button>
            </div>
          }
        />

        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: Tags,
              label: 'Role hygiene',
              text: 'Keep names short, distinct, and assignment-ready.'
            },
            {
              icon: Layers3,
              label: 'Reuse first',
              text: 'Prefer updating roles before creating near-duplicates.'
            },
            {
              icon: RefreshCw,
              label: 'Live catalog',
              text: 'Refresh pulls the latest backend role state.'
            }
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.45)]">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <item.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-950">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Card className="overflow-hidden border-0 bg-white shadow-none ring-1 ring-neutral-200">
          <CardContent className="p-0">
            <VolunteerRolesTable refreshSignal={refreshSignal} />
          </CardContent>
        </Card>

        <VolunteerRoleForm open={createOpen} onOpenChange={setCreateOpen} onCreated={() => setRefreshSignal((s) => s + 1)} />
      </div>
    </PermissionGate>
  );
}
