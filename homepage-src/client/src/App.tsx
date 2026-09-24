import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ContactHeaderPreview from "./pages/ContactHeaderPreview";
import Home from "./pages/Home";
import Legal from "./pages/Legal";
import CookieConsentBanner from "./components/CookieConsentBanner";
import WhatsAppFloat from "./components/WhatsAppFloat";

const PrivacyPage = () => <Legal kind="privacy" />;
const TermsPage = () => <Legal kind="terms" />;

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/preview-contato"} component={ContactHeaderPreview} />
      <Route path={"/privacidade"} component={PrivacyPage} />
      <Route path={"/termos"} component={TermsPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <CookieConsentBanner />
          <WhatsAppFloat />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
