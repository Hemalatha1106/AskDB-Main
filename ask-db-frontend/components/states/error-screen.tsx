'use client';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';

interface ErrorScreenProps {
  title: string;
  description?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  actionSecondary?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorScreen({
  title,
  description,
  icon = '⚠️',
  action,
  actionSecondary,
}: ErrorScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-6">{icon}</div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        {description && (
          <p className="text-muted-foreground mb-8">{description}</p>
        )}
        <div className="flex flex-col gap-3">
          {action && (
            <Button onClick={action.onClick} size="lg">
              {action.label}
            </Button>
          )}
          {actionSecondary && (
            <Button
              onClick={actionSecondary.onClick}
              variant="outline"
              size="lg"
            >
              {actionSecondary.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ConnectionErrorScreen() {
  return (
    <ErrorScreen
      icon="🔌"
      title="Connection Failed"
      description="Unable to connect to your database. Please check your credentials and try again."
      action={{
        label: 'Try Again',
        onClick: () => window.location.reload(),
      }}
      actionSecondary={{
        label: 'Go Back',
        onClick: () => window.history.back(),
      }}
    />
  );
}

export function DatabaseErrorScreen() {
  return (
    <ErrorScreen
      icon="🗄️"
      title="Database Error"
      description="Something went wrong while accessing your database. Our team has been notified."
      action={{
        label: 'Return to Dashboard',
        onClick: () => (window.location.href = '/dashboard'),
      }}
    />
  );
}

export function NotFoundScreen() {
  return (
    <ErrorScreen
      icon="🔍"
      title="Page Not Found"
      description="The page you're looking for doesn't exist."
      action={{
        label: 'Go Home',
        onClick: () => (window.location.href = '/'),
      }}
    />
  );
}
