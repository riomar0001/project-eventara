'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Section, Row } from './shared';

export function ToasterSection() {
  return (
    <Section title="Toaster (Sonner)">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-2">
          <Row wrap>
            <Button variant="outline" onClick={() => toast('Event has been created', { description: 'Apr 9, 2026 at 10:00 AM' })}>
              Default
            </Button>
            <Button variant="outline" onClick={() => toast.success('Transaction completed', { description: 'Payment of $240.00 processed successfully.' })}>
              Success
            </Button>
            <Button variant="outline" onClick={() => toast.error('Transfer failed', { description: 'Insufficient funds in your account.' })}>
              Error
            </Button>
            <Button variant="outline" onClick={() => toast.warning('Budget alert', { description: "You've reached 86% of your monthly limit." })}>
              Warning
            </Button>
            <Button variant="outline" onClick={() => toast.info('New feature', { description: 'Goal tracking is now available in your dashboard.' })}>
              Info
            </Button>
          </Row>
          <Row wrap>
            <Button
              variant="outline"
              onClick={() =>
                toast('Export ready', {
                  description: 'Your report has been generated.',
                  action: { label: 'Download', onClick: () => toast.success('Downloading…') }
                })
              }
            >
              With action
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast('File uploaded', {
                  description: 'transactions-april.csv',
                  action: { label: 'Undo', onClick: () => toast('Upload cancelled') },
                  cancel: { label: 'Dismiss', onClick: () => {} }
                })
              }
            >
              With action + cancel
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.promise(new Promise((res) => setTimeout(res, 2000)), {
                  loading: 'Syncing transactions…',
                  success: 'Transactions synced',
                  error: 'Sync failed'
                })
              }
            >
              Promise
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast('Saving changes', {
                  duration: Infinity,
                  action: { label: 'Dismiss', onClick: () => {} }
                })
              }
            >
              Persistent
            </Button>
          </Row>
        </CardContent>
      </Card>
    </Section>
  );
}
