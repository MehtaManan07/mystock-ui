import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useThemeStore } from './stores/themeStore';
import { useDraftStore } from './stores/draftStore';
import { lightTheme, darkTheme } from './theme';
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

// Theme wrapper component
const ThemedApp: React.FC = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkTheme : lightTheme;
  const { clearOldDrafts } = useDraftStore();

  // Clean up old drafts on app initialization
  useEffect(() => {
    clearOldDrafts(30); // Remove drafts older than 30 days
  }, [clearOldDrafts]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <BrowserRouter>
          <AppRoutes />
          <NotificationProvider />
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
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
