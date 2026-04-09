import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Section, Row } from './shared';

export function ScrollAreaSection() {
  return (
    <Section title="Scroll Area">
      <Card>
        <CardContent className="pt-2">
          <Row align="start">
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] text-muted-foreground">Vertical (200px)</p>
              <ScrollArea className="h-48 w-56 rounded-xl border p-3">
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 20 }, (_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-muted" />
                      <span className="text-xs text-muted-foreground">List item {i + 1}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] text-muted-foreground">Horizontal</p>
              <ScrollArea className="w-64 rounded-xl border">
                <div className="flex gap-3 p-3" style={{ width: 'max-content' }}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                      Card {i + 1}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Row>
        </CardContent>
      </Card>
    </Section>
  );
}
