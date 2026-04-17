'use client';

import { useState } from 'react';
import { MobileFloatingAction, PrimaryPageAction } from '@/components/admin/shared/primary-page-action';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VolunteersTableToolbar } from './table/table-toolbar';
import { VolunteersTableContent } from './table/volunteers-table';
import { OperationsPageIntro } from './volunteers-shared';
import { ADMIN_OPERATIONS_PATHS, volunteerRecords } from '@/constants/admin/operations';

export function VolunteersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Training' | 'Inactive'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'Flexible' | 'Weekends' | 'Weeknights'>('all');

  const filteredVolunteers = volunteerRecords.filter((volunteer) => {
    const matchesSearch =
      search.length === 0 ||
      volunteer.name.toLowerCase().includes(search.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(search.toLowerCase()) ||
      volunteer.skills.some((skill) => skill.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || volunteer.status === statusFilter;
    const matchesAvailability = availabilityFilter === 'all' || volunteer.availability === availabilityFilter;

    return matchesSearch && matchesStatus && matchesAvailability;
  });

  return (
    <div className="space-y-6">
      <MobileFloatingAction cta="Add volunteer" href={ADMIN_OPERATIONS_PATHS.volunteerCreate} theme="emerald" />

      <OperationsPageIntro
        eyebrow="Volunteer Command"
        title="Volunteer Management"
        description="Keep the service crew legible at a glance with roster health, readiness, and contribution volume pulled into one high-visibility command surface."
        metrics={[
          {
            label: 'Roster size',
            value: volunteerRecords.length,
            hint: 'Volunteers currently represented in the mock roster.'
          },
          {
            label: 'Active crew',
            value: volunteerRecords.filter((volunteer) => volunteer.status === 'Active').length,
            hint: 'Volunteers currently shown as ready for assignment.'
          },
          {
            label: 'Tracked hours',
            value: volunteerRecords.reduce((sum, volunteer) => sum + volunteer.hoursContributed, 0),
            hint: 'Combined contribution hours across the current volunteer preview.'
          }
        ]}
        actions={
          <PrimaryPageAction
            cta="Add volunteer"
            helper="Create a new volunteer profile right from the roster command view."
            href={ADMIN_OPERATIONS_PATHS.volunteerCreate}
            label="Primary Action"
            theme="emerald"
          />
        }
      />

      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardHeader className="flex flex-col items-start gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Volunteer roster</CardTitle>
            <CardDescription>Use search and filters to review the volunteer pool and jump into a profile or edit page.</CardDescription>
          </div>
          <VolunteersTableToolbar
            availabilityFilter={availabilityFilter}
            onAvailabilityFilterChange={setAvailabilityFilter}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            search={search}
            statusFilter={statusFilter}
          />
        </CardHeader>

        <CardContent className="p-0">
          <VolunteersTableContent volunteers={filteredVolunteers} />
        </CardContent>
      </Card>
    </div>
  );
}
