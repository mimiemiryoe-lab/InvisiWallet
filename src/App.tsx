import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { StarknetProvider } from "./contexts/StarknetContext";
import { PrivacyProvider } from "./contexts/PrivacyContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import Request from "./pages/Request";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <StarknetProvider>
          <PrivacyProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/signup" element={<Auth mode="signup" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/send" element={<Send />} />
            <Route path="/request" element={<Request />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
          </PrivacyProvider>
        </StarknetProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
