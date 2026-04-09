import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Section, Row, Label } from './shared';

export function SkeletonSection() {
  return (
    <Section title="Skeleton">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-2">
          <Row>
            <Label>lines</Label>
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </Row>
          <Row>
            <Label>circles</Label>
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-6 rounded-full" />
          </Row>
          <Row align="start">
            <Label>card block</Label>
            <div className="flex flex-1 gap-3">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </Row>
        </CardContent>
      </Card>
    </Section>
  );
}
