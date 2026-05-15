'use client';

import { FeedbackStatsRow } from '@/components/admin/feedback/feedback-stats-row';
import { FeedbackTable } from '@/components/admin/feedback/feedback-table';
import { RatingDistributionChart } from '@/components/admin/feedback/rating-distribution-chart';
import { UsersPerWeekChart } from '@/components/admin/feedback/users-per-week-chart';
import { useAppFeedback } from '@/hooks/admin/feedback/use-app-feedback';
import { useFeedbackAnalytics } from '@/hooks/admin/feedback/use-feedback-analytics';
import { useUsersPerWeek } from '@/hooks/admin/feedback/use-users-per-week';

export default function FeedbackPage() {
  const { analytics, isLoading: analyticsLoading } = useFeedbackAnalytics();
  const { entries, isLoading: weekLoading } = useUsersPerWeek(12);
  const { feedback, total, page, totalPages, pageSize, isLoading: tableLoading, setPage } = useAppFeedback();

  return (
    <div className="flex flex-col gap-4">
      <FeedbackStatsRow analytics={analytics} isLoading={analyticsLoading} />

      <div className="flex flex-col gap-4 lg:flex-row">
        <RatingDistributionChart analytics={analytics} isLoading={analyticsLoading} />
        <UsersPerWeekChart entries={entries} isLoading={weekLoading} />
      </div>

      <FeedbackTable
        feedback={feedback}
        total={total}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        isLoading={tableLoading}
        onPageChange={setPage}
      />
    </div>
  );
}
