import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader,
  SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Section, Row } from './shared';

const sides = ['right', 'left', 'top', 'bottom'] as const;

export function SheetSection() {
  return (
    <Section title="Sheet">
      <Card>
        <CardContent className="pt-2">
          <Row wrap>
            {sides.map(side => (
              <Sheet key={side}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="capitalize">{side}</Button>
                </SheetTrigger>
                <SheetContent side={side}>
                  <SheetHeader>
                    <SheetTitle>Sheet — {side}</SheetTitle>
                    <SheetDescription>
                      This sheet slides in from the {side}. Use it for drawers, panels, or mobile navigation.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col gap-3 p-6">
                    <Input placeholder="Name" />
                    <Input placeholder="Email" />
                  </div>
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button>Save</Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            ))}
          </Row>
        </CardContent>
      </Card>
    </Section>
  );
}
