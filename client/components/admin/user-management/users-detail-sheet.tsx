'use client';

import { RefreshCcw, ShieldX } from 'lucide-react';
import {
  formatDateTime,
  getInitials,
  humanizeRoleName,
  humanizeValue,
  RolePermissionList,
  UserStatusBadge
} from '@/components/admin/user-management/user-management-ui';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminUserAccountDetailResponse as AdminUserAccountDetail } from '@/api/types.gen';

interface AdminUserDetailSheetProps {
  detail: AdminUserAccountDetail | null;
  error: string | null;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  open: boolean;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-2 text-sm font-medium wrap-break-word text-neutral-900">{value}</p>
    </div>
  );
}

export function AdminUserDetailSheet({ detail, error, isLoading, onOpenChange, onRefresh, open }: AdminUserDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-4xl">
        <SheetHeader className="border-b">
          <SheetTitle>User details</SheetTitle>
          <SheetDescription>Full administrative profile, security, activity, and deletion metadata for the selected account.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-full overflow-y-auto">
          <div className="space-y-6 p-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-3xl" />
                <Skeleton className="h-48 w-full rounded-3xl" />
                <Skeleton className="h-48 w-full rounded-3xl" />
              </div>
            ) : error ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
                <ShieldX className="size-10 text-red-500" />
                <div className="space-y-1">
                  <p className="text-base font-medium">Unable to load user details</p>
                  <p className="text-muted-foreground text-sm">{error}</p>
                </div>
                <Button variant="outline" onClick={onRefresh}>
                  <RefreshCcw className="size-4" />
                  Try again
                </Button>
              </div>
            ) : detail ? (
              <>
                <div className="rounded-3xl border border-neutral-200 bg-linear-to-br from-white to-neutral-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="size-12">
                        <AvatarFallback className="text-base font-semibold">{getInitials(detail.name)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-xl font-semibold">{detail.name}</p>
                        <p className="text-muted-foreground text-sm">{detail.email}</p>
                        <div className="flex flex-wrap gap-2">
                          <UserStatusBadge status={detail.status} />
                          <Badge variant="outline" className="text-[11px]">
                            {humanizeRoleName(detail.role_name)}
                          </Badge>
                          <Badge variant="outline" className="text-[11px]">
                            {detail.email_verified ? 'Verified email' : 'Verification pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {detail.deletion_scheduled_for ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Deletion scheduled for {formatDateTime(detail.deletion_scheduled_for)}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div>
                      <p className="text-sm font-medium">Profile</p>
                      <p className="text-muted-foreground text-xs">Identity, onboarding, and personal details.</p>
                    </div>
                    <div className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-2">
                      <DetailItem label="User ID" value={detail.user_id} />
                      <DetailItem label="Alias" value={detail.alias ? `@${detail.alias}` : 'Not set'} />
                      <DetailItem label="First Name" value={detail.first_name ?? 'Not set'} />
                      <DetailItem label="Last Name" value={detail.last_name ?? 'Not set'} />
                      <DetailItem label="Age Group" value={humanizeValue(detail.age_group)} />
                      <DetailItem label="Gender" value={humanizeValue(detail.gender)} />
                      <DetailItem label="Education" value={humanizeValue(detail.education_level)} />
                      <DetailItem label="Occupation" value={detail.occupation ?? 'Not set'} />
                      <DetailItem label="Onboarding" value={detail.onboarding_completed ? 'Completed' : 'Pending'} />
                      <DetailItem label="Onboarded At" value={formatDateTime(detail.onboarding_completed_at)} />
                    </div>
                    <div className="mt-8 rounded-2xl bg-neutral-50 px-4 py-3">
                      <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">Bio</p>
                      <p className="mt-2 text-sm leading-6">{detail.bio?.trim() ? detail.bio : 'Not set'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div>
                      <p className="text-sm font-medium">Security</p>
                      <p className="text-muted-foreground text-xs">Verification, password, and account protection signals.</p>
                    </div>
                    <div className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-2">
                      <DetailItem label="Email Verified" value={detail.email_verified ? 'Yes' : 'No'} />
                      <DetailItem label="Verified At" value={formatDateTime(detail.email_verified_at)} />
                      <DetailItem label="Password Changed" value={formatDateTime(detail.password_change_at)} />
                      <DetailItem label="Failed Login Attempts" value={detail.failed_login_attempts.toString()} />
                      <DetailItem label="Locked Until" value={formatDateTime(detail.locked_until)} />
                      <DetailItem label="Account Status" value={humanizeValue(detail.status)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div>
                      <p className="text-sm font-medium">Role access</p>
                      <p className="text-muted-foreground text-xs">Current effective role and the permissions included with that role.</p>
                    </div>
                    <div className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-2">
                      <DetailItem label="Current Role" value={humanizeRoleName(detail.role_name)} />
                      <DetailItem label="Permission Count" value={(detail.role_permissions?.length ?? 0).toString()} />
                    </div>
                    <div className="mt-8 space-y-3">
                      <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">Role Permissions</p>
                      <RolePermissionList permissions={detail.role_permissions} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div>
                      <p className="text-sm font-medium">Activity</p>
                      <p className="text-muted-foreground text-xs">Latest account activity and session history counters.</p>
                    </div>
                    <div className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-2">
                      <DetailItem label="Last Login" value={formatDateTime(detail.last_login_at)} />
                      <DetailItem label="Last Activity" value={formatDateTime(detail.last_activity_at)} />
                      <DetailItem label="Login Count" value={detail.login_count.toString()} />
                      <DetailItem label="Created At" value={formatDateTime(detail.created_at)} />
                      <DetailItem label="Updated At" value={formatDateTime(detail.updated_at)} />
                      <DetailItem label="Deleted At" value={formatDateTime(detail.deleted_at)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div>
                      <p className="text-sm font-medium">Deletion state</p>
                      <p className="text-muted-foreground text-xs">Pending deletion requests, reason, and final deletion timestamp.</p>
                    </div>
                    <div className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-2">
                      <DetailItem label="Requested At" value={formatDateTime(detail.deletion_requested_at)} />
                      <DetailItem label="Scheduled For" value={formatDateTime(detail.deletion_scheduled_for)} />
                      <DetailItem label="Requested By" value={detail.deletion_requested_by ?? 'Not available'} />
                    </div>
                    <div className="mt-8 rounded-2xl bg-neutral-50 px-4 py-3">
                      <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">Deletion Reason</p>
                      <p className="mt-2 text-sm leading-6">{detail.deletion_reason ?? 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
