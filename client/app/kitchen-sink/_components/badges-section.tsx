import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Section, Row } from './shared';

export function BadgesSection() {
  return (
    <Section title="Badges">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-2">
          <div>
            <p className="text-muted-foreground mb-2 text-[10px]">Variants</p>
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
            <p className="text-muted-foreground mb-2 text-[10px]">Standard colors</p>
            <Row wrap>
              <Badge variant="outline" className="border-green-200 bg-green-100 text-green-700">
                Success
              </Badge>
              <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-700">
                Warning
              </Badge>
              <Badge variant="outline" className="border-red-200 bg-red-100 text-red-700">
                Error
              </Badge>
              <Badge variant="outline" className="border-blue-200 bg-blue-100 text-blue-700">
                Info
              </Badge>
              <Badge variant="outline" className="border-purple-200 bg-purple-100 text-purple-700">
                Purple
              </Badge>
              <Badge variant="outline" className="border-orange-200 bg-orange-100 text-orange-700">
                Orange
              </Badge>
              <Badge variant="outline" className="border-gray-200 bg-gray-100 text-gray-600">
                Neutral
              </Badge>
            </Row>
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}
