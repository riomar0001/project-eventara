import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Section, Row, Label } from './shared';

export function SeparatorSection() {
  return (
    <Section title="Separator">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-2">
          <Row>
            <Label>horizontal</Label>
            <div className="flex-1">
              <Separator />
            </div>
          </Row>
          <Row>
            <Label>vertical</Label>
            <div className="flex h-8 items-center gap-3">
              <span className="text-muted-foreground text-xs">Left</span>
              <Separator orientation="vertical" />
              <span className="text-muted-foreground text-xs">Right</span>
            </div>
          </Row>
        </CardContent>
      </Card>
    </Section>
  );
}
