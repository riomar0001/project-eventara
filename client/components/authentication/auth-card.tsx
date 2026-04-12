import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthCardProps {
  title: string;
  description: string;
  formId: string;
  submitLabel: string;
  submittingLabel: string;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({
  title,
  description,
  formId,
  submitLabel,
  submittingLabel,
  isLoading,
  onSubmit,
  children,
  footer
}: AuthCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
          {children}
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button type="submit" form={formId} className="w-full" disabled={isLoading}>
          {isLoading ? submittingLabel : submitLabel}
        </Button>
        {footer}
      </CardFooter>
    </Card>
  );
}
