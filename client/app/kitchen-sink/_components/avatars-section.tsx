import {
  Avatar, AvatarFallback, AvatarImage,
  AvatarBadge, AvatarGroup, AvatarGroupCount,
} from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Section, Row, Label } from './shared';

export function AvatarsSection() {
  return (
    <Section title="Avatars">
      <Card>
        <CardContent className="flex flex-col gap-5 pt-2">
          <Row>
            <Label>sizes</Label>
            <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
            <Avatar size="default"><AvatarFallback>MD</AvatarFallback></Avatar>
            <Avatar size="lg"><AvatarFallback>LG</AvatarFallback></Avatar>
          </Row>
          <Row>
            <Label>with image</Label>
            <Avatar><AvatarImage src="https://github.com/shadcn.png" alt="shadcn" /><AvatarFallback>SC</AvatarFallback></Avatar>
            <Avatar><AvatarImage src="" alt="broken" /><AvatarFallback>MJ</AvatarFallback></Avatar>
          </Row>
          <Row>
            <Label>with badge</Label>
            <Avatar><AvatarFallback>AB</AvatarFallback><AvatarBadge /></Avatar>
            <Avatar size="lg"><AvatarFallback>CD</AvatarFallback><AvatarBadge /></Avatar>
          </Row>
          <Row>
            <Label>group</Label>
            <AvatarGroup>
              <Avatar><AvatarFallback>A1</AvatarFallback></Avatar>
              <Avatar><AvatarFallback>A2</AvatarFallback></Avatar>
              <Avatar><AvatarFallback>A3</AvatarFallback></Avatar>
              <AvatarGroupCount>+5</AvatarGroupCount>
            </AvatarGroup>
          </Row>
        </CardContent>
      </Card>
    </Section>
  );
}
