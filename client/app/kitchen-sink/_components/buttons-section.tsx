import { Home, Star, Zap, Settings, Plus, Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Section, Row, Label } from './shared';

const variants = [
  { variant: 'default' as const,     label: 'default' },
  { variant: 'outline' as const,     label: 'outline' },
  { variant: 'secondary' as const,   label: 'secondary' },
  { variant: 'ghost' as const,       label: 'ghost' },
  { variant: 'destructive' as const, label: 'destructive' },
  { variant: 'link' as const,        label: 'link' },
  { variant: 'black' as const,       label: 'black' },
  { variant: 'link-black' as const,       label: 'link-black' },
  { variant: 'link-destructive' as const, label: 'link-destructive' },
  { variant: 'amber' as const,            label: 'amber' },
  { variant: 'amber-outline' as const,    label: 'amber-outline' },
  { variant: 'amber-ghost' as const,      label: 'amber-ghost' },
  { variant: 'link-amber' as const,       label: 'link-amber' },
];

export function ButtonsSection() {
  return (
    <>
      <Section title="Buttons — Variants">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-2">
            {variants.map(({ variant, label }) => (
              <Row key={variant}>
                <Label>{label}</Label>
                <Button variant={variant}>Button</Button>
                <Button variant={variant} disabled>Disabled</Button>
              </Row>
            ))}
            <Row>
              <Label>with icons</Label>
              <Button><Plus className="size-4" /> Add item</Button>
              <Button variant="outline"><Bell className="size-4" /> Notify</Button>
              <Button variant="destructive"><Trash2 className="size-4" /> Delete</Button>
            </Row>
          </CardContent>
        </Card>
      </Section>

      <Section title="Buttons — Sizes">
        <Card>
          <CardContent className="pt-2">
            <Row wrap>
              <Button size="xs">xs</Button>
              <Button size="sm">sm</Button>
              <Button size="default">default</Button>
              <Button size="lg">lg</Button>
              <Separator orientation="vertical" className="h-8" />
              <Button size="icon-xs"><Star className="size-3" /></Button>
              <Button size="icon-sm"><Zap className="size-4" /></Button>
              <Button size="icon"><Settings className="size-4" /></Button>
              <Button size="icon-lg"><Home className="size-5" /></Button>
            </Row>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
