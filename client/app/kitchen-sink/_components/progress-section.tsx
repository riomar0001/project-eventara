import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Section, Row, Label } from './shared';

export function ProgressSection() {
  return (
    <Section title="Progress">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-2">
          {[25, 50, 75, 100].map(v => (
            <Row key={v}>
              <Label>{v}%</Label>
              <Progress value={v} className="flex-1" />
            </Row>
          ))}
          <Row>
            <Label>green</Label>
            <Progress value={60} className="flex-1" style={{ '--progress-color': 'oklch(0.648 0.2 131.684)' } as React.CSSProperties} />
          </Row>
          <Row>
            <Label>amber</Label>
            <Progress value={85} className="flex-1" style={{ '--progress-color': 'oklch(0.769 0.188 70.08)' } as React.CSSProperties} />
          </Row>
        </CardContent>
      </Card>
    </Section>
  );
}
