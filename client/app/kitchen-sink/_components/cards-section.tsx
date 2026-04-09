import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '@/components/ui/card';
import { Section } from './shared';

export function CardsSection() {
  return (
    <Section title="Cards">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Default card</CardTitle>
            <CardDescription>With all sub-components.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="icon-sm">
                <ExternalLink className="size-4" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Uses <code className="bg-muted rounded px-1 text-xs">CardHeader</code>, <code className="bg-muted rounded px-1 text-xs">CardTitle</code>,{' '}
              <code className="bg-muted rounded px-1 text-xs">CardDescription</code>, <code className="bg-muted rounded px-1 text-xs">CardAction</code>,{' '}
              <code className="bg-muted rounded px-1 text-xs">CardContent</code>, and <code className="bg-muted rounded px-1 text-xs">CardFooter</code>.
            </p>
          </CardContent>
          <CardFooter className="gap-2 border-t pt-4">
            <Button size="sm">Save</Button>
            <Button size="sm" variant="outline">
              Cancel
            </Button>
          </CardFooter>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Small card</CardTitle>
            <CardDescription>size=&quot;sm&quot; — tighter padding.</CardDescription>
            <CardAction>
              <Badge variant="secondary">New</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Compact layout for dense UIs like sidebars and panels.</p>
          </CardContent>
          <CardFooter className="border-t pt-3">
            <Button size="xs" variant="outline">
              View details
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Section>
  );
}
