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
import Planning from "./pages/Planning";
import Production from "./pages/Production";
import Stocks from "./pages/Stocks";
import Logistique from "./pages/Logistique";
import Laboratoire from "./pages/Laboratoire";
import Depenses from "./pages/Depenses";
import Ventes from "./pages/Ventes";
import Users from "./pages/Users";
import Approbations from "./pages/Approbations";
import Alertes from "./pages/Alertes";
import Rapports from "./pages/Rapports";
import Fournisseurs from "./pages/Fournisseurs";
import Pointage from "./pages/Pointage";
import Prestataires from "./pages/Prestataires";
import Paiements from "./pages/Paiements";
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
            <Route path="/planning" element={<Planning />} />
            <Route path="/production" element={<Production />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/logistique" element={<Logistique />} />
            <Route path="/laboratoire" element={<Laboratoire />} />
            <Route path="/depenses" element={<Depenses />} />
            <Route path="/ventes" element={<Ventes />} />
            <Route path="/users" element={<Users />} />
            <Route path="/approbations" element={<Approbations />} />
            <Route path="/alertes" element={<Alertes />} />
            <Route path="/rapports" element={<Rapports />} />
            <Route path="/fournisseurs" element={<Fournisseurs />} />
            <Route path="/pointage" element={<Pointage />} />
            <Route path="/prestataires" element={<Prestataires />} />
            <Route path="/paiements" element={<Paiements />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
