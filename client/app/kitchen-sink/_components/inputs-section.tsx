import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Section, Row, Label } from './shared';

export function InputsSection() {
  return (
    <Section title="Inputs">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-2">
          <Row>
            <Label>default</Label>
            <Input className="max-w-xs" placeholder="Enter value…" />
          </Row>
          <Row>
            <Label>disabled</Label>
            <Input className="max-w-xs" placeholder="Disabled" disabled />
          </Row>
          <Row align="start">
            <Label>invalid</Label>
            <div className="flex max-w-xs flex-1 flex-col gap-1">
              <Input placeholder="Invalid" aria-invalid />
              <p className="text-destructive text-xs">This field is required.</p>
            </div>
          </Row>
          <Row>
            <Label>with value</Label>
            <Input className="max-w-xs" defaultValue="michael@finex.com" />
          </Row>
        </CardContent>
      </Card>
    </Section>
  );
}
