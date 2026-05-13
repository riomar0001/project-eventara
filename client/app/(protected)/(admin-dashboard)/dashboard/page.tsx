'use client';

import { useDashboard } from '@/hooks/admin/dashboard/use-dashboard';
import { DashboardStatsRow } from '@/components/admin/dashboard/stats-row';
import { UserGrowthChart } from '@/components/admin/dashboard/user-growth-chart';
import { TopVenuesCard } from '@/components/admin/dashboard/top-venues-card';
import { LeaderboardCard } from '@/components/admin/dashboard/leaderboard-card';
import { EventsTableCard } from '@/components/admin/dashboard/events-table-card';
import type { ParticipantLeaderboardResponse, VolunteerLeaderboardResponse } from '@/api/types.gen';

function toParticipantEntries(items: ParticipantLeaderboardResponse[]) {
  return items.map((p) => ({
    id: p.user_id,
    fullName: p.full_name,
    alias: p.alias,
    profilePictureUrl: p.profile_picture_url,
    count: p.count
  }));
}

function toVolunteerEntries(items: VolunteerLeaderboardResponse[]) {
  return items.map((v) => ({
    id: v.volunteer_id ?? v.user_id ?? Math.random().toString(),
    fullName: v.full_name,
    alias: v.alias,
    profilePictureUrl: v.profile_picture_url,
    sublabel: v.role_name ?? undefined,
    count: v.count
  }));
}

export default function DashboardPage() {
  const { metrics, isLoading } = useDashboard();

  return (
    <div className="flex flex-col gap-4">
      <DashboardStatsRow metrics={metrics} isLoading={isLoading} />

      <div className="flex flex-col gap-4 lg:flex-row">
        <UserGrowthChart data={metrics?.users_per_week ?? []} isLoading={isLoading} />
        <TopVenuesCard venues={metrics?.top_venues ?? []} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LeaderboardCard
          title="Top Participants This Week"
          subtitle="Most event check-ins in the current week"
          entries={toParticipantEntries(metrics?.top_weekly_participants ?? [])}
          countLabel="check-ins"
          isLoading={isLoading}
        />
        <LeaderboardCard
          title="Top Volunteer Applications"
          subtitle="Most applications submitted this week"
          entries={toVolunteerEntries(metrics?.top_weekly_volunteer_applications ?? [])}
          countLabel="applications"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LeaderboardCard
          title="Most Active Participants"
          subtitle="All-time event participation leaders"
          entries={toParticipantEntries(metrics?.top_active_participants ?? [])}
          countLabel="events"
          isLoading={isLoading}
        />
        <LeaderboardCard
          title="Most Active Volunteers"
          subtitle="All-time volunteer contribution leaders"
          entries={toVolunteerEntries(metrics?.top_active_volunteers ?? [])}
          countLabel="sessions"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <EventsTableCard
          title="Ongoing Events"
          subtitle="Events currently in progress"
          events={metrics?.ongoing_events ?? []}
          isLoading={isLoading}
        />
        <EventsTableCard
          title="Upcoming Events"
          subtitle="Next posted events"
          events={metrics?.upcoming_events ?? []}
          isLoading={isLoading}
        />
      </div>

      <EventsTableCard
        title="Recent Events"
        subtitle="Last 10 created events"
        events={metrics?.recent_events ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
