import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useResolvedTheme } from './stores/themeStore';
import { useDraftStore } from './stores/draftStore';
import AppRoutes from './routes';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationProvider } from './components/common/NotificationProvider';

// Create a client with proper caching settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache
      refetchOnMount: false, // Don't refetch if data exists
      refetchOnWindowFocus: false, // Don't refetch on tab focus
      refetchOnReconnect: false, // Don't refetch on reconnect
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

const ThemedApp: React.FC = () => {
  const theme = useResolvedTheme();
  const { clearOldDrafts } = useDraftStore();

  // Drive Tailwind's dark mode from the resolved theme. `index.html` applies
  // the same class before first paint to avoid a light flash. `color-scheme`
  // additionally tells the browser to render native widgets (scrollbars, date
  // pickers, autofill) in the matching mode.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  // Clean up old drafts on app initialization
  useEffect(() => {
    clearOldDrafts(30); // Remove drafts older than 30 days
  }, [clearOldDrafts]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <NotificationProvider />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemedApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
