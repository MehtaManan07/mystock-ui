import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <Card className="w-full max-w-lg">
            <CardContent className="py-8 text-center">
              <p className="mb-4 text-6xl">😵</p>
              <h2 className="text-xl font-semibold">Something went wrong</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                An unexpected error occurred. Please try refreshing the page or go
                back to the dashboard.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <div className="my-6 max-h-50 overflow-auto rounded-md bg-destructive/10 p-4 text-left">
                  <pre className="font-mono text-xs break-words whitespace-pre-wrap text-destructive">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              <div className="mt-6 flex justify-center gap-3">
                <Button onClick={this.handleReset}>
                  <RefreshCw />
                  Refresh Page
                </Button>
                <Button variant="outline" onClick={this.handleGoHome}>
                  <Home />
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
