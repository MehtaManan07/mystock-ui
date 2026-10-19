import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading data. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <Alert variant="destructive" className="mb-6 max-w-md text-left">
        <AlertCircle />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
