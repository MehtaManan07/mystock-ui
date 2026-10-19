import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  /** Optional lower-emphasis action rendered beside the primary one. */
  secondaryAction?: React.ReactNode;
  className?: string;
  /** Tightens padding for use inside cards and dialogs. */
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = <Inbox />,
  actionLabel,
  actionIcon,
  onAction,
  secondaryAction,
  className,
  compact = false,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 text-center',
        compact ? 'py-10' : 'py-16 sm:py-20',
        className
      )}
    >
      {/* Textured tile keeps the icon from floating in dead space. */}
      <div className="relative mb-5">
        <div className="absolute inset-0 -m-3 rounded-2xl bg-grain opacity-60" />
        <div
          className={cn(
            'relative flex items-center justify-center rounded-2xl border border-border/70 bg-card shadow-xs',
            compact ? 'size-14' : 'size-16',
            '[&_svg]:text-muted-foreground/70',
            compact ? '[&_svg]:size-6' : '[&_svg]:size-7'
          )}
        >
          {icon}
        </div>
      </div>

      <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      {message && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      )}

      {(actionLabel && onAction) || secondaryAction ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && onAction && (
            <Button onClick={onAction}>
              {actionIcon}
              {actionLabel}
            </Button>
          )}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
};

export default EmptyState;
