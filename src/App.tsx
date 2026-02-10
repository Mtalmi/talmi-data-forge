import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { PreviewRoleProvider } from "@/hooks/usePreviewRole";
import { SecurityProvider } from "@/components/security/SecurityProvider";
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
import DepensesV2 from "./pages/DepensesV2";
import Ventes from "./pages/Ventes";
import Users from "./pages/Users";
import Approbations from "./pages/Approbations";
import Alertes from "./pages/Alertes";
import Rapports from "./pages/Rapports";
import Journal from "./pages/Journal";
import Fournisseurs from "./pages/Fournisseurs";
import Pointage from "./pages/Pointage";
import Prestataires from "./pages/Prestataires";
import Paiements from "./pages/Paiements";
import Rapprochement from "./pages/Rapprochement";
import DriverView from "./pages/DriverView";
import Maintenance from "./pages/Maintenance";
import AuditSuperviseur from "./pages/AuditSuperviseur";
import AuditExterne from "./pages/AuditExterne";
import SecurityDashboard from "./pages/SecurityDashboard";
import ClientTracking from "./pages/ClientTracking";
import AideSupport from "./pages/AideSupport";
import Contracts from "./pages/Contracts";
import ModeFormation from "./pages/ModeFormation";
import Creances from "./pages/Creances";
import Dettes from "./pages/Dettes";
import Prets from "./pages/Prets";
import Immobilisations from "./pages/Immobilisations";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import AIAssistant from "./pages/AIAssistant";
import Landing from "./pages/Landing";
import { AIFloatingBubble } from "./components/ai/AIFloatingBubble";
import WS7Import from "./pages/WS7Import";
import WS7Batches from "./pages/WS7Batches";
import WS7Discovery from "./pages/WS7Discovery";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PreviewRoleProvider>
              {/* TITANIUM SHIELD: Security wrapper with session timeout & HTTPS enforcement */}
              <SecurityProvider>
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
                <Route path="/depenses-v2" element={<DepensesV2 />} />
                <Route path="/ventes" element={<Ventes />} />
                <Route path="/users" element={<Users />} />
                <Route path="/approbations" element={<Approbations />} />
                <Route path="/alertes" element={<Alertes />} />
                <Route path="/rapports" element={<Rapports />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/fournisseurs" element={<Fournisseurs />} />
                <Route path="/pointage" element={<Pointage />} />
                <Route path="/prestataires" element={<Prestataires />} />
                <Route path="/paiements" element={<Paiements />} />
                <Route path="/rapprochement" element={<Rapprochement />} />
                <Route path="/chauffeur" element={<DriverView />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/audit-superviseur" element={<AuditSuperviseur />} />
                <Route path="/audit-externe" element={<AuditExterne />} />
                <Route path="/securite" element={<SecurityDashboard />} />
                {/* Client Portal - Public tracking page (no auth required) */}
                <Route path="/track/:token" element={<ClientTracking />} />
                {/* User Manual & Support */}
                <Route path="/aide" element={<AideSupport />} />
                {/* Contracts Module */}
                <Route path="/contracts" element={<Contracts />} />
                {/* AR/AP Management */}
                <Route path="/creances" element={<Creances />} />
                <Route path="/dettes" element={<Dettes />} />
                {/* Loan Management */}
                <Route path="/prets" element={<Prets />} />
                {/* Fixed Assets Management */}
                <Route path="/immobilisations" element={<Immobilisations />} />
                {/* Mode Formation - Interactive Training Simulations */}
                <Route path="/formation" element={<ModeFormation />} />
                {/* User Profile */}
                <Route path="/user_profile" element={<UserProfile />} />
                {/* AI Assistant */}
                <Route path="/ai" element={<AIAssistant />} />
                <Route path="/landing" element={<Landing />} />
                {/* WS7 Integration */}
                <Route path="/ws7-import" element={<WS7Import />} />
                <Route path="/ws7-batches" element={<WS7Batches />} />
                <Route path="/ws7-discovery" element={<WS7Discovery />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <AIFloatingBubble />
              </SecurityProvider>
            </PreviewRoleProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
