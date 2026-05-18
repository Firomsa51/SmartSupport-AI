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
} from "@clerk/clerk-react";
import { dark } from "@clerk/themes"; // ✅ FIX 2: correct theme import
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { queryClient } from "@/lib/queryClient";
import { useEffect, useRef, Component, ReactNode } from "react";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NewChatbot from "@/pages/chatbots/new";
import ChatbotDetail from "@/pages/chatbots/detail";
import EmbedPage from "@/pages/chatbots/embed";
import WidgetPage from "@/pages/widget";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

// ✅ FIX 2: use `dark` theme from @clerk/themes
const clerkAppearance = {
  baseTheme: dark,
  cssLayerName: "clerk" as const,
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
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-slate-900 rounded-2xl w-[440px] max-w-full overflow-hidden border border-slate-700",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-100 font-semibold",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButtonText: "text-slate-200",
    formFieldLabel: "text-slate-300",
    footerActionLink: "text-blue-400 hover:text-blue-300",
    footerActionText: "text-slate-400",
    dividerText: "text-slate-500",
    formButtonPrimary: "bg-blue-600 hover:bg-blue-500 text-white",
    formFieldInput:
      "bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500",
    footerAction: "border-t border-slate-700",
    dividerLine: "bg-slate-700",
    alert: "bg-slate-800 border-slate-700",
    socialButtonsBlockButton:
      "border-slate-600 bg-slate-800 hover:bg-slate-700",
  },
};

// ✅ FIX 7: Global Error Boundary to prevent blank screen crashes
interface ErrorBoundaryState { hasError: boolean; message: string }
class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
          <p className="text-slate-400 mb-6 text-center max-w-md">{this.state.message}</p>
          <button
            onClick={() => window.location.href = "/"}
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

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        // ✅ FIX Problem A: redirect after sign-in
        forceRedirectUrl={`${basePath}/dashboard`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        // ✅ FIX Problem A: redirect after sign-up
        forceRedirectUrl={`${basePath}/dashboard`}
      />
    </div>
  );
}

// ✅ FIX 6: loading guard prevents flash
function HomeRedirect() {
  const { isLoaded } = useAuth();
  if (!isLoaded) return null; // wait for Clerk to resolve auth state

  return (
    <>
      {/* ✅ FIX 1: SignedIn/SignedOut instead of Show */}
      <SignedIn>
        <Redirect to="/dashboard" />
      </SignedIn>
      <SignedOut>
        <LandingPage />
      </SignedOut>
    </>
  );
}

// ✅ FIX 1 + 6: correct components + loading guard
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isLoaded } = useAuth();
  if (!isLoaded) return null;

  return (
    <>
      <SignedIn>
        <Component />
      </SignedIn>
      <SignedOut>
        <Redirect to="/" />
      </SignedOut>
    </>
  );
}

// ✅ FIX 5: named wrapper components — prevents remounting on every render
function DashboardRoute() { return <ProtectedRoute component={Dashboard} />; }
function NewChatbotRoute() { return <ProtectedRoute component={NewChatbot} />; }
function ChatbotDetailRoute() { return <ProtectedRoute component={ChatbotDetail} />; }
function EmbedPageRoute() { return <ProtectedRoute component={EmbedPage} />; }

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
      <Route path="/widget/:uid" component={WidgetPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ✅ FIX 3 & 4: ClerkProvider only here (not in main.tsx), using `navigate` instead of deprecated routerPush/routerReplace
function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      navigate={(to) => setLocation(stripBase(to))}
    >
      <QueryClientProvider client={queryClient}>
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
