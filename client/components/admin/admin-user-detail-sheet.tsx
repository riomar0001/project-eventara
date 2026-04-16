'use client';

import { RefreshCcw, ShieldX } from 'lucide-react';
import { DetailField, formatDateTime, getInitials, humanizeValue, UserStatusBadge } from '@/components/admin/admin-user-management-ui';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { type AdminUserAccountDetail } from '@/api/admin-user-accounts';

interface AdminUserDetailSheetProps {
  detail: AdminUserAccountDetail | null;
  error: string | null;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  open: boolean;
}

export function AdminUserDetailSheet({ detail, error, isLoading, onOpenChange, onRefresh, open }: AdminUserDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader className="border-b">
          <SheetTitle>User details</SheetTitle>
          <SheetDescription>Full administrative profile, security, activity, and deletion metadata for the selected account.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-full">
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
                            {detail.role_name ?? 'No role assigned'}
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
                  <div>
                    <p className="text-sm font-medium">Profile</p>
                    <p className="text-muted-foreground text-xs">Identity, onboarding, and personal details.</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <DetailField label="User ID" value={detail.user_id} />
                    <DetailField label="Alias" value={detail.alias ? `@${detail.alias}` : 'Not set'} />
                    <DetailField label="First name" value={detail.first_name ?? 'Not set'} />
                    <DetailField label="Last name" value={detail.last_name ?? 'Not set'} />
                    <DetailField label="Age group" value={humanizeValue(detail.age_group)} />
                    <DetailField label="Gender" value={humanizeValue(detail.gender)} />
                    <DetailField label="Education" value={humanizeValue(detail.education_level)} />
                    <DetailField label="Occupation" value={detail.occupation ?? 'Not set'} />
                    <DetailField label="Onboarding" value={detail.onboarding_completed ? 'Completed' : 'Pending'} />
                    <DetailField label="Onboarded at" value={formatDateTime(detail.onboarding_completed_at)} />
                  </div>
                  <DetailField label="Bio" value={detail.bio?.trim() ? detail.bio : 'Not set'} />
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Security</p>
                    <p className="text-muted-foreground text-xs">Verification, password, and account protection signals.</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <DetailField label="Email verified" value={detail.email_verified ? 'Yes' : 'No'} />
                    <DetailField label="Verified at" value={formatDateTime(detail.email_verified_at)} />
                    <DetailField label="Password changed" value={formatDateTime(detail.password_change_at)} />
                    <DetailField label="Failed login attempts" value={detail.failed_login_attempts.toString()} />
                    <DetailField label="Locked until" value={formatDateTime(detail.locked_until)} />
                    <DetailField label="Current role" value={detail.role_name ?? 'No role assigned'} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Activity</p>
                    <p className="text-muted-foreground text-xs">Latest account activity and session history counters.</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <DetailField label="Last login" value={formatDateTime(detail.last_login_at)} />
                    <DetailField label="Last activity" value={formatDateTime(detail.last_activity_at)} />
                    <DetailField label="Login count" value={detail.login_count.toString()} />
                    <DetailField label="Created at" value={formatDateTime(detail.created_at)} />
                    <DetailField label="Updated at" value={formatDateTime(detail.updated_at)} />
                    <DetailField label="Deleted at" value={formatDateTime(detail.deleted_at)} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Deletion state</p>
                    <p className="text-muted-foreground text-xs">Pending deletion requests, reason, and final deletion timestamp.</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <DetailField label="Requested at" value={formatDateTime(detail.deletion_requested_at)} />
                    <DetailField label="Scheduled for" value={formatDateTime(detail.deletion_scheduled_for)} />
                    <DetailField label="Requested by" value={detail.deletion_requested_by ?? 'Not available'} />
                    <DetailField label="Deletion reason" value={detail.deletion_reason ?? 'Not provided'} />
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
