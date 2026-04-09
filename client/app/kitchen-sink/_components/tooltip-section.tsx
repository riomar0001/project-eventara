import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Section, Row } from './shared';

const positions = [
  { side: 'top' as const,    label: 'Hover me (top)' },
  { side: 'bottom' as const, label: 'Bottom' },
  { side: 'left' as const,   label: 'Left' },
  { side: 'right' as const,  label: 'Right' },
];

export function TooltipSection() {
  return (
    <Section title="Tooltip">
      <Card>
        <CardContent className="pt-2">
          <Row wrap>
            {positions.map(({ side, label }) => (
              <Tooltip key={side}>
                <TooltipTrigger asChild>
                  <Button variant="outline">{label}</Button>
                </TooltipTrigger>
                <TooltipContent side={side}>Tooltip on {side}</TooltipContent>
              </Tooltip>
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost"><Bell className="size-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
          </Row>
        </CardContent>
      </Card>
    </Section>
  );
}
