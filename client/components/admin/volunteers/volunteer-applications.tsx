'use client';

import { ClipboardList, Clock, UserCheck, UserX } from 'lucide-react';
import { useVolunteerApplications } from '@/hooks/admin/volunteers/use-volunteer-applications';
import { useVolunteerRoleList } from '@/hooks/admin/volunteers/use-volunteer-role-list';
import { VolunteerApplicationsTable } from './volunteer-applications-table';
import { BackLink, OperationsPageIntro } from './volunteers-shared';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

export function VolunteerApplicationsPage() {
  const { applications, total, page, totalPages, statusFilter, search, isLoading, error, setPage, setStatusFilter, setSearch, refetch } =
    useVolunteerApplications(20);
  const volunteerRoles = useVolunteerRoleList();

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      <BackLink href={ADMIN_OPERATIONS_PATHS.volunteers} label="Back to volunteers" />

      <OperationsPageIntro
        eyebrow="Applicant Review"
        title="Volunteer applications"
        description="Review, approve, or reject volunteer applications submitted by community members. Approved applicants are immediately added to the volunteer roster."
        tone="emerald"
        metrics={[
          {
            label: 'Total applications',
            value: total,
            hint: 'All applications across every status.',
          },
          {
            label: 'Pending review',
            value: pendingCount,
            hint: 'Applications currently awaiting a decision.',
          },
          {
            label: 'Active roles',
            value: volunteerRoles.length,
            hint: 'Volunteer roles available to assign on approval.',
          },
        ]}
      />

      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            icon: Clock,
            label: 'Review in order',
            text: 'Oldest pending applications are shown first. Clear the queue regularly to keep response times short.',
          },
          {
            icon: UserCheck,
            label: 'Approve with a role',
            text: 'Approving creates an active volunteer profile and assigns the applicant a role and contact phone.',
          },
          {
            icon: UserX,
            label: 'Rejections are final',
            text: 'Rejected applicants can submit a new application. The rejection cannot be reversed from this panel.',
          },
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

      <VolunteerApplicationsTable
        records={applications}
        total={total}
        page={page}
        totalPages={totalPages}
        statusFilter={statusFilter}
        search={search}
        volunteerRoles={volunteerRoles}
        isLoading={isLoading}
        error={error}
        onPageChange={setPage}
        onStatusFilterChange={setStatusFilter}
        onSearchChange={setSearch}
        onRefetch={refetch}
      />
    </div>
  );
}
