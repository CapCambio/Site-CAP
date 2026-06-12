
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Toaster } from "@/components/ui/toaster";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { lazyWithRetry, LazyLoad } from "@/components/lazy-load";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import './lib/i18n';

// Lazy load pages com tratamento de erro e retry
const Home = lazyWithRetry(() => import("@/pages/Home"), {
  fallback: <LoadingOverlay isVisible={true} />
});

const LoginPage = lazyWithRetry(() => import("@/pages/auth-page"), {
  fallback: <LoadingOverlay isVisible={true} />
});

const NotFound = lazyWithRetry(() => import("@/pages/not-found"), {
  fallback: <LoadingOverlay isVisible={true} />
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});


function AppContent() {
  // Configurar notificações push
  const { isSupported, isSubscribed, isLoading } = usePushNotifications();
  
  return (
    <div className="min-h-screen bg-black">
      <LazyLoad>
        <Switch>
          <Route path="/auth" component={LoginPage} />
          <ProtectedRoute path="/" component={Home} />
          <Route component={NotFound} />
        </Switch>
      </LazyLoad>
      <Toaster />
      <PWAInstallPrompt />
    </div>
  );
}

function App() {
  // Registrar o Service Worker
  useServiceWorker();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
