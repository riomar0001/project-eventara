import { Sparkles, Target, UserRoundCheck } from 'lucide-react';
import { PotentialVolunteersTableContent } from '@/components/admin/volunteers/table/potential-volunteers-table';
import { BackLink, OperationsPageIntro } from '@/components/admin/volunteers/volunteers-shared';
import { PermissionGate } from '@/components/auth/permission-gate';
import { Card, CardContent } from '@/components/ui/card';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

export default function AdminPotentialVolunteersPage() {
  return (
    <PermissionGate feature="volunteers" action="read">
      <div className="space-y-6">
        <BackLink href={ADMIN_OPERATIONS_PATHS.volunteers} label="Back to volunteers" />

        <OperationsPageIntro
          eyebrow="Candidate Radar"
          title="Potential volunteers"
          description="Spot community members with repeat event participation and decide who is ready to move into the active volunteer roster."
          tone="sky"
          metrics={[
            {
              label: 'Candidate pool',
              value: 6,
              hint: 'Seeded participation records currently visible.'
            },
            {
              label: 'High signal',
              value: 2,
              hint: 'People with 11 or more participated events.'
            },
            {
              label: 'Review bands',
              value: 3,
              hint: 'Participation filters for faster triage.'
            }
          ]}
        />

        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: UserRoundCheck,
              label: 'Roster-ready signal',
              text: 'Prioritize people with repeated participation and clear contact details.'
            },
            {
              icon: Target,
              label: 'Participation bands',
              text: 'Use bands to separate light interest from consistent event presence.'
            },
            {
              icon: Sparkles,
              label: 'Next action',
              text: 'Qualified candidates can be contacted before adding a volunteer profile.'
            }
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.45)]">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
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
            <PotentialVolunteersTableContent />
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
