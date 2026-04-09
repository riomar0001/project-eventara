import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Section, Row } from './shared';

export function BadgesSection() {
  return (
    <Section title="Badges">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-2">
          <div>
            <p className="mb-2 text-[10px] text-muted-foreground">Variants</p>
            <Row wrap>
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="ghost">Ghost</Badge>
              <Badge variant="link">Link</Badge>
            </Row>
          </div>
          <div>
            <p className="mb-2 text-[10px] text-muted-foreground">Standard colors</p>
            <Row wrap>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Success</Badge>
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Warning</Badge>
              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Error</Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">Info</Badge>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">Purple</Badge>
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">Orange</Badge>
              <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Neutral</Badge>
            </Row>
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}
