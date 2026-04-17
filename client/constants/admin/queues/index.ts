export const QUEUE_MANAGEMENT_TEXT = {
  eyebrow: 'Background operations',
  description:
    'Inspect live ARQ queue pressure, monitor worker heartbeat signals, and recover permanently failed jobs from the dead-letter queue without leaving the admin workspace.',
  liveOverviewTitle: 'Queue pulse',
  liveOverviewDescription: 'A live read on worker throughput, backlog pressure, and the current failure footprint in the async job system.',
  deadLetterTitle: 'Dead-letter queue',
  deadLetterDescription:
    'Failed jobs are parked here after exhausting their retry budget. Review the payload, retry the work, or discard the record if it is no longer relevant.',
  detailTitle: 'Failed job detail',
  detailPlaceholderTitle: 'Choose a dead-letter job',
  detailPlaceholderDescription: 'Select a failed job to inspect its arguments, timing, and final exception payload before taking action.',
  emptyTitle: 'No dead-letter jobs right now',
  emptyDescription: 'The queue is clean at the moment. Failed jobs will appear here after they exhaust their worker retry budget.',
  statsErrorTitle: 'Unable to inspect queue state',
  dlqErrorTitle: 'Unable to load dead-letter jobs',
  purgeTitle: 'Purge dead-letter queue',
  purgeDescription: 'This permanently removes every failed job from the dead-letter store. The action cannot be undone.'
} as const;
