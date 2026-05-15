import { Eye, MoreHorizontal, PencilLine } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { VolunteerRecord } from '@/hooks/admin/volunteers/use-volunteers';

export type VolunteerTableRecord = VolunteerRecord;

export type VolunteerColumnMeta = {
  cellClassName?: string;
  headerClassName?: string;
};

function getInitials(firstName: string | null, lastName: string | null, alias: string | null) {
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase();
  }
  if (alias) return alias.slice(0, 2).toUpperCase();
  return '??';
}

function getDisplayName(firstName: string | null, lastName: string | null, alias: string | null) {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (alias) return alias;
  return '—';
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-neutral-100 text-neutral-600',
  suspended: 'bg-red-100 text-red-700'
};

export function createVolunteerColumns(
  onEdit?: (volunteer: VolunteerTableRecord) => void,
  onView?: (volunteer: VolunteerTableRecord) => void
): ColumnDef<VolunteerTableRecord>[] {
  return [
    {
      id: 'profile',
      header: 'Volunteer',
      cell: ({ row }) => {
        const { first_name, last_name, alias, email, contact_phone } = row.original;
        const displayName = getDisplayName(first_name, last_name, alias);
        const initials = getInitials(first_name, last_name, alias);

        return (
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="bg-emerald-50 font-medium text-emerald-700">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="font-medium text-neutral-950">{displayName}</p>
              <p className="text-sm text-neutral-500">{email ?? contact_phone}</p>
            </div>
          </div>
        );
      },
      meta: {
        headerClassName: 'pl-6',
        cellClassName: 'pl-6'
      } satisfies VolunteerColumnMeta
    },
    {
      id: 'alias',
      header: 'Alias',
      cell: ({ row }) => <p className="text-sm text-neutral-500">{row.original.alias ? `@${row.original.alias}` : '—'}</p>
    },
    {
      id: 'role',
      header: 'Role',
      cell: ({ row }) => <p className="text-sm text-neutral-700">{row.original.role_name ?? '—'}</p>
    },
    {
      id: 'contact',
      header: 'Phone',
      cell: ({ row }) => <p className="text-sm text-neutral-600">{row.original.contact_phone}</p>
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="secondary" className={STATUS_STYLES[row.original.status] ?? 'bg-neutral-100 text-neutral-600'}>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </Badge>
      )
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open volunteer actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView ? (
                <DropdownMenuItem onClick={() => onView(row.original)}>
                  <Eye className="size-4" />
                  View profile
                </DropdownMenuItem>
              ) : null}
              {onEdit ? (
                <DropdownMenuItem onClick={() => onEdit(row.original)}>
                  <PencilLine className="size-4" />
                  Edit volunteer
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      meta: {
        headerClassName: 'px-6 text-right',
        cellClassName: 'px-6 text-right'
      } satisfies VolunteerColumnMeta
    }
  ];
}

export const volunteerColumns = createVolunteerColumns(
  () => {},
  () => {}
);
