import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthStatusCardProps {
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
}

export function AuthStatusCard({ title, description, children }: AuthStatusCardProps) {
  return (
    <Card className="gap-8 py-8">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children && <CardFooter className="flex flex-col gap-5">{children}</CardFooter>}
    </Card>
  );
}
