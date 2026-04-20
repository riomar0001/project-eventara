import { Eye, MoreHorizontal, PencilLine } from 'lucide-react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ADMIN_OPERATIONS_PATHS, getVolunteerInitials, type VolunteerRecord } from '@/constants/admin/operations';

export type VolunteerColumnMeta = {
  cellClassName?: string;
  headerClassName?: string;
};

export const volunteerColumns: ColumnDef<VolunteerRecord>[] = [
  {
    id: 'profile',
    header: 'Volunteer',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarImage src={row.original.photo} alt={row.original.name} />
          <AvatarFallback>{getVolunteerInitials(row.original.name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="font-medium text-neutral-950">{row.original.name}</p>
          <p className="text-sm text-neutral-500">{row.original.email}</p>
        </div>
      </div>
    ),
    meta: {
      headerClassName: 'pl-6',
      cellClassName: 'pl-6'
    } satisfies VolunteerColumnMeta
  },
  {
    id: 'role',
    header: 'Role',
    cell: ({ row }) => <p className="text-sm text-neutral-700">{row.original.primaryRole}</p>
  },
  {
    id: 'skills',
    header: 'Skills',
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1.5">
        {row.original.skills.slice(0, 2).map((skill) => (
          <Badge key={skill} variant="outline" className="text-[10px]">
            {skill}
          </Badge>
        ))}
      </div>
    )
  },
  {
    id: 'availability',
    header: 'Availability',
    cell: ({ row }) => <p className="text-sm text-neutral-700">{row.original.availability}</p>
  },
  {
    id: 'hours',
    header: 'Hours',
    cell: ({ row }) => <p className="text-sm font-medium text-neutral-950">{row.original.hoursContributed} hrs</p>
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge
        variant="secondary"
        className={
          row.original.status === 'Active'
            ? 'bg-emerald-100 text-emerald-800'
            : row.original.status === 'Training'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-neutral-100 text-neutral-600'
        }
      >
        {row.original.status}
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
            <DropdownMenuItem asChild>
              <Link href={ADMIN_OPERATIONS_PATHS.volunteerDetail(row.original.id)}>
                <Eye className="size-4" />
                View profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={ADMIN_OPERATIONS_PATHS.volunteerEdit(row.original.id)}>
                <PencilLine className="size-4" />
                Edit volunteer
              </Link>
            </DropdownMenuItem>
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
