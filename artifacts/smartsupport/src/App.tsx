import { lazy, Suspense, useEffect, useRef, Component, ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  useClerk,
  useAuth,
} from "@clerk/react";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { queryClient } from "@/lib/queryClient";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";

// Lazy load protected pages for better performance
const Dashboard = lazy(() => import("@/pages/dashboard"));
const NewChatbot = lazy(() => import("@/pages/chatbots/new"));
const ChatbotDetail = lazy(() => import("@/pages/chatbots/detail"));
const EmbedPage = lazy(() => import("@/pages/chatbots/embed"));
const WidgetPage = lazy(() => import("@/pages/widget"));

// Environment variable for Clerk key (add to your .env)
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

// Safe base path stripper
function stripBase(path: string): string {
  if (!basePath) return path;
  if (path.startsWith(basePath)) {
    const stripped = path.slice(basePath.length);
    return stripped || "/";
  }
  return path;
}

// Clerk appearance (dark mode)
const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#3b82f6",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#94a3b8",
    colorDanger: "#ef4444",
    colorBackground: "#0f172a",
    colorInput: "#1e293b",
    colorInputForeground: "#f1f5f9",
    colorNeutral: "#334155",
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
};

// Loading component
function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100">
      <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      <p className="mt-4 text-slate-400">Loading SmartSupport...</p>
    </div>
  );
}

// Error boundary
interface ErrorBoundaryState { hasError: boolean; message: string }
class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Caught error:", error, errorInfo);
    // You could send to a logging service here
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
          <p className="text-slate-400 mb-6 text-center max-w-md">{this.state.message}</p>
          <button
            onClick={() => window.location.href = basePath || "/"}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm"
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Auth token setter for API client
function ClerkAuthTokenSetter() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}

// Invalidate query cache when user changes (sign out / sign in)
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

// Sign In page
function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        forceRedirectUrl={`${basePath}/dashboard`}
      />
    </div>
  );
}

// Sign Up page
function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        forceRedirectUrl={`${basePath}/dashboard`}
      />
    </div>
  );
}

// Home route – redirects authenticated users to dashboard, others see landing page
function HomeRedirect() {
  const { isLoaded } = useAuth();
  if (!isLoaded) return <LoadingScreen />;

  return (
    <>
      <SignedIn>
        <Redirect to="/dashboard" />
      </SignedIn>
      <SignedOut>
        <LandingPage />
      </SignedOut>
    </>
  );
}

// Protected route wrapper with Suspense for lazy loading
function ProtectedRoute({ component: Component }: { component: React.ComponentType<unknown> }) {
  const { isLoaded } = useAuth();
  if (!isLoaded) return <LoadingScreen />;

  return (
    <>
      <SignedIn>
        <Suspense fallback={<LoadingScreen />}>
          <Component />
        </Suspense>
      </SignedIn>
      <SignedOut>
        <Redirect to="/" />
      </SignedOut>
    </>
  );
}

// Component wrappers for protected routes
function DashboardRoute() { return <ProtectedRoute component={Dashboard} />; }
function NewChatbotRoute() { return <ProtectedRoute component={NewChatbot} />; }
function ChatbotDetailRoute() { return <ProtectedRoute component={ChatbotDetail} />; }
function EmbedPageRoute() { return <ProtectedRoute component={EmbedPage} />; }

// Public widget route (unprotected)
function WidgetPageRoute() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <WidgetPage />
    </Suspense>
  );
}

// Main router using wouter
function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/dashboard" component={DashboardRoute} />
      <Route path="/chatbots/new" component={NewChatbotRoute} />
      <Route path="/chatbots/:id/embed" component={EmbedPageRoute} />
      <Route path="/chatbots/:id" component={ChatbotDetailRoute} />
      <Route path="/widget/:uid" component={WidgetPageRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Clerk provider with custom navigate to work with wouter and basePath
function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  // Safe navigation that handles absolute URLs and base path
  const handleNavigate = (to: string | URL) => {
    if (!to) return;
    let path: string;
    if (typeof to === "string") {
      try {
        // Try to parse as URL
        const url = new URL(to, window.location.origin);
        if (url.origin !== window.location.origin) {
          // External URL – use full page navigation
          window.location.href = to;
          return;
        }
        path = url.pathname;
      } catch {
        // Not a valid URL, treat as path
        path = to;
      }
    } else {
      path = to.pathname;
    }
    const relativePath = stripBase(path);
    setLocation(relativePath || "/");
  };

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      navigate={handleNavigate}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkAuthTokenSetter />
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

// Root App component
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="smartsupport-theme">
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
