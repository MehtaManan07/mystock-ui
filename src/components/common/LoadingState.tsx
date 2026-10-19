import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from 'cn';

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  fullPage = false,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        fullPage ? 'min-h-[60vh]' : 'py-16'
      )}
    >
      <Loader2 className="mb-3 size-9 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default LoadingState;
