import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = <Inbox className="size-14 text-muted-foreground/40" strokeWidth={1.5} />,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      {message && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{message}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
