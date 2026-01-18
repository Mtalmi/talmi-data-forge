import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Formules from "./pages/Formules";
import Clients from "./pages/Clients";
import Prix from "./pages/Prix";
import Bons from "./pages/Bons";
import Production from "./pages/Production";
import Users from "./pages/Users";
import Approbations from "./pages/Approbations";
import Alertes from "./pages/Alertes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/formules" element={<Formules />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/prix" element={<Prix />} />
            <Route path="/bons" element={<Bons />} />
            <Route path="/production" element={<Production />} />
            <Route path="/users" element={<Users />} />
            <Route path="/approbations" element={<Approbations />} />
            <Route path="/alertes" element={<Alertes />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
