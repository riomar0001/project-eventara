export const QUEUE_MANAGEMENT_TEXT = {
  eyebrow: 'Background operations',
  description: 'See what tasks are running in the background, check if workers are active, and manually retry or clean up any tasks that failed.',
  liveOverviewTitle: 'Queue pulse',
  liveOverviewDescription: 'A live snapshot of how many tasks are waiting, running, finished, and how many workers are currently active.',
  deadLetterTitle: 'Dead-letter queue',
  deadLetterDescription:
    'Tasks that failed too many times end up here. You can review what went wrong, try running them again, or remove them if they are no longer needed.',
  detailTitle: 'Failed job detail',
  detailPlaceholderTitle: 'Choose a failed task',
  detailPlaceholderDescription: 'Select a failed task from the list to see what it was trying to do, when it ran, and why it failed.',
  emptyTitle: 'No failed tasks right now',
  emptyDescription: 'Everything looks good. Any tasks that fail after multiple retries will show up here.',
  statsErrorTitle: 'Unable to inspect queue state',
  dlqErrorTitle: 'Unable to load failed tasks',
  purgeTitle: 'Clear all failed tasks',
  purgeDescription: 'This will permanently delete every failed task from the list. This cannot be undone.'
} as const;
