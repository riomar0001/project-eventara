'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, UserPlus } from 'lucide-react';
import { AddVolunteerDialog, EditVolunteerDialog } from '@/components/admin/volunteers/volunteer-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { VolunteerRecord } from '@/hooks/admin/volunteers/use-volunteers';
import { useVolunteers } from '@/hooks/admin/volunteers/use-volunteers';
import { VolunteersTableToolbar } from './table/table-toolbar';
import { VolunteersTableContent } from './table/volunteers-table';
import { OperationsPageIntro } from './volunteers-shared';
import type { VolunteerStatus } from '@/api/types.gen';

export function VolunteersPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<VolunteerRecord | null>(null);
  const [search, setSearch] = useState('');

  const { volunteers, total, page, totalPages, statusFilter, isLoading, error, setPage, setStatusFilter, refetch } = useVolunteers(20);

  const activeCount = volunteers.filter((v) => v.status === 'active').length;

  const q = search.toLowerCase();
  const filteredVolunteers = search
    ? volunteers.filter((v) => {
        const fullName = [v.first_name, v.last_name].filter(Boolean).join(' ').toLowerCase();
        return (
          fullName.includes(q) ||
          (v.alias?.toLowerCase().includes(q) ?? false) ||
          (v.email?.toLowerCase().includes(q) ?? false) ||
          v.contact_phone.toLowerCase().includes(q)
        );
      })
    : volunteers;

  function handleVolunteerAdded() {
    refetch();
  }

  function handleVolunteerUpdated() {
    refetch();
  }

  return (
    <div className="space-y-6">
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4 sm:hidden">
        <div className="pointer-events-auto mx-auto max-w-sm rounded-full border border-emerald-200/80 bg-white/88 p-2 shadow-[0_20px_45px_-26px_rgba(6,95,70,0.28)] backdrop-blur-md">
          <Button
            size="lg"
            className="h-11 w-full rounded-full border-0 bg-neutral-950 text-white shadow-[0_16px_30px_-18px_rgba(15,23,42,0.5)] hover:bg-neutral-800"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            Add volunteer
          </Button>
        </div>
      </div>

      <OperationsPageIntro
        eyebrow="Volunteer Command"
        title="Volunteer Management"
        description="Keep the service crew legible at a glance with roster health, readiness, and contribution volume pulled into one high-visibility command surface."
        metrics={[
          {
            label: 'Roster size',
            value: total,
            hint: 'Total registered volunteers across all statuses.'
          },
          {
            label: 'Active crew',
            value: activeCount,
            hint: 'Volunteers on this page currently in active status.'
          },
          {
            label: 'Current page',
            value: `${page} / ${totalPages}`,
            hint: 'Page position within the paginated volunteer roster.'
          }
        ]}
        actions={
          <div className="w-full max-w-[18rem] rounded-[24px] border border-emerald-300/55 bg-white/76 p-3.5 text-stone-950 shadow-[0_18px_55px_-32px_rgba(6,95,70,0.32)] backdrop-blur-sm xl:max-w-76">
            <p className="text-[10px] font-semibold tracking-[0.24em] text-emerald-800 uppercase">Primary Action</p>
            <p className="mt-1 text-[13px] leading-5 text-stone-600">Add an existing user to the roster without leaving this view.</p>
            <Button
              size="lg"
              className="mt-3 h-11 w-full rounded-xl border-0 bg-emerald-600 font-semibold text-white shadow-[0_14px_35px_-18px_rgba(15,23,42,0.45)] hover:bg-emerald-500"
              onClick={() => setCreateOpen(true)}
            >
              <UserPlus className="size-4" />
              Add volunteer
            </Button>
          </div>
        }
      />

      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardHeader className="flex flex-col items-start gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Volunteer roster</CardTitle>
            <CardDescription>Use search and filters to review the volunteer pool and jump into a profile or edit page.</CardDescription>
          </div>
          <VolunteersTableToolbar
            statusFilter={statusFilter}
            onStatusFilterChange={(value: VolunteerStatus | null) => setStatusFilter(value)}
            search={search}
            onSearchChange={setSearch}
          />
        </CardHeader>

        <CardContent className="p-0">
          <VolunteersTableContent
            volunteers={filteredVolunteers}
            isLoading={isLoading}
            error={error}
            onEditVolunteer={(volunteer) => setEditingVolunteer(volunteer)}
          />
        </CardContent>

        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-sm text-neutral-500">
              Page {page} of {totalPages} &middot; {total} volunteers
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1 || isLoading}>
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages || isLoading}>
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <AddVolunteerDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={handleVolunteerAdded} />

      {editingVolunteer && (
        <EditVolunteerDialog
          volunteer={editingVolunteer}
          open={!!editingVolunteer}
          onOpenChange={(open) => {
            if (!open) setEditingVolunteer(null);
          }}
          onSaved={handleVolunteerUpdated}
        />
      )}
    </div>
  );
}
