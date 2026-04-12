import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthStatusCardProps {
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
}

export function AuthStatusCard({ title, description, children }: AuthStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children && <CardFooter className="flex flex-col gap-3">{children}</CardFooter>}
    </Card>
  );
}
