import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { PreviewRoleProvider } from "@/hooks/usePreviewRole";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import { AIFloatingBubble } from "./components/ai/AIFloatingBubble";
import { I18nProvider } from "@/i18n/I18nContext";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

// Critical path — loaded eagerly
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes for code splitting & performance
const Formules = lazy(() => import("./pages/Formules"));
const Clients = lazy(() => import("./pages/Clients"));
const Prix = lazy(() => import("./pages/Prix"));
const Bons = lazy(() => import("./pages/Bons"));
const Planning = lazy(() => import("./pages/Planning"));
const Production = lazy(() => import("./pages/Production"));
const Stocks = lazy(() => import("./pages/Stocks"));
const Logistique = lazy(() => import("./pages/Logistique"));
const Laboratoire = lazy(() => import("./pages/Laboratoire"));
const Depenses = lazy(() => import("./pages/Depenses"));
const DepensesV2 = lazy(() => import("./pages/DepensesV2"));
const Ventes = lazy(() => import("./pages/Ventes"));
const Users = lazy(() => import("./pages/Users"));
const Approbations = lazy(() => import("./pages/Approbations"));
const Alertes = lazy(() => import("./pages/Alertes"));
const Rapports = lazy(() => import("./pages/Rapports"));
const Journal = lazy(() => import("./pages/Journal"));
const Fournisseurs = lazy(() => import("./pages/Fournisseurs"));
const Pointage = lazy(() => import("./pages/Pointage"));
const Securite = lazy(() => import("./pages/Securite"));
const Prestataires = lazy(() => import("./pages/Prestataires"));
const Paiements = lazy(() => import("./pages/Paiements"));
const Rapprochement = lazy(() => import("./pages/Rapprochement"));
const DriverView = lazy(() => import("./pages/DriverView"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const AuditSuperviseur = lazy(() => import("./pages/AuditSuperviseur"));
const AuditExterne = lazy(() => import("./pages/AuditExterne"));
const SecurityDashboard = lazy(() => import("./pages/SecurityDashboard"));
const ClientTracking = lazy(() => import("./pages/ClientTracking"));
const AideSupport = lazy(() => import("./pages/AideSupport"));
const Analytics = lazy(() => import("./pages/Analytics"));
const LeadScoring = lazy(() => import("./pages/LeadScoring"));
const SuccessStories = lazy(() => import("./pages/SuccessStories"));
const Settings = lazy(() => import("./pages/Settings"));
const Contracts = lazy(() => import("./pages/Contracts"));
const ModeFormation = lazy(() => import("./pages/ModeFormation"));
const Creances = lazy(() => import("./pages/Creances"));
const Dettes = lazy(() => import("./pages/Dettes"));
const Prets = lazy(() => import("./pages/Prets"));
const Immobilisations = lazy(() => import("./pages/Immobilisations"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const WS7Import = lazy(() => import("./pages/WS7Import"));
const WS7Batches = lazy(() => import("./pages/WS7Batches"));
const WS7Discovery = lazy(() => import("./pages/WS7Discovery"));
const Surveillance = lazy(() => import("./pages/Surveillance"));
const AnalyticsBI = lazy(() => import("./pages/AnalyticsBI"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const IndustryBenchmarking = lazy(() => import("./pages/IndustryBenchmarking"));
const WorkflowAutomation = lazy(() => import("./pages/WorkflowAutomation"));
const PredictiveMaintenance = lazy(() => import("./pages/PredictiveMaintenance"));
const MobileField = lazy(() => import("./pages/MobileField"));
const TrainingAcademy = lazy(() => import("./pages/TrainingAcademy"));
const CommunityForum = lazy(() => import("./pages/CommunityForum"));
const OperationsAgent = lazy(() => import("./pages/OperationsAgent"));
const ArchiveLivraisons = lazy(() => import("./pages/ArchiveLivraisons"));

const queryClient = new QueryClient();

// Minimal loading fallback
function RouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

const App = () => (
  <I18nProvider>
    <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <PreviewRoleProvider>
              <SecurityProvider>
                <Suspense fallback={<RouteLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<Index />} />
                    <Route path="/app" element={<Index />} />
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
                    <Route path="/hse" element={<Securite />} />
                    <Route path="/track/:token" element={<ClientTracking />} />
                    <Route path="/aide" element={<AideSupport />} />
                    <Route path="/contracts" element={<Contracts />} />
                    <Route path="/creances" element={<Creances />} />
                    <Route path="/dettes" element={<Dettes />} />
                    <Route path="/prets" element={<Prets />} />
                    <Route path="/immobilisations" element={<Immobilisations />} />
                    <Route path="/formation" element={<ModeFormation />} />
                    <Route path="/user_profile" element={<UserProfile />} />
                    <Route path="/ai" element={<AIAssistant />} />
                    <Route path="/ws7-import" element={<WS7Import />} />
                    <Route path="/ws7-batches" element={<WS7Batches />} />
                    <Route path="/ws7-discovery" element={<WS7Discovery />} />
                    <Route path="/surveillance" element={<Surveillance />} />
                    <Route path="/analytics" element={<AnalyticsBI />} />
                    <Route path="/analytics-demo" element={<AdvancedAnalytics />} />
                    <Route path="/benchmarking" element={<IndustryBenchmarking />} />
                    <Route path="/install" element={<InstallApp />} />
                    <Route path="/automation" element={<WorkflowAutomation />} />
                    <Route path="/predictive-maintenance" element={<PredictiveMaintenance />} />
                    <Route path="/mobile" element={<MobileField />} />
                    <Route path="/lead-scoring" element={<LeadScoring />} />
                    <Route path="/success-stories" element={<SuccessStories />} />
                    <Route path="/academy" element={<TrainingAcademy />} />
                     <Route path="/community" element={<CommunityForum />} />
                     <Route path="/operations-agent" element={<OperationsAgent />} />
                     <Route path="/settings" element={<Settings />} />
                     <Route path="/archive-livraisons" element={<ArchiveLivraisons />} />
                     <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <AIFloatingBubble />
              </SecurityProvider>
            </PreviewRoleProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </I18nProvider>
);

export default App;

