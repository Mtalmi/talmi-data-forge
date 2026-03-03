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
import { lazyRetry } from "@/lib/lazyRetry";

// Critical path — Auth is eager (LCP element), others lazy
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Index/Dashboard lazy-loaded with retry for stale-chunk recovery
const Index = lazy(() => lazyRetry(() => import("./pages/Index")));

// Lazy-loaded routes with retry wrapper
const Formules = lazy(() => lazyRetry(() => import("./pages/Formules")));
const Clients = lazy(() => lazyRetry(() => import("./pages/Clients")));
const Prix = lazy(() => lazyRetry(() => import("./pages/Prix")));
const Bons = lazy(() => lazyRetry(() => import("./pages/Bons")));
const Planning = lazy(() => lazyRetry(() => import("./pages/Planning")));
const Production = lazy(() => lazyRetry(() => import("./pages/Production")));
const Stocks = lazy(() => lazyRetry(() => import("./pages/Stocks")));
const Logistique = lazy(() => lazyRetry(() => import("./pages/Logistique")));
const Laboratoire = lazy(() => lazyRetry(() => import("./pages/Laboratoire")));
const Depenses = lazy(() => lazyRetry(() => import("./pages/Depenses")));
const DepensesV2 = lazy(() => lazyRetry(() => import("./pages/DepensesV2")));
const Ventes = lazy(() => lazyRetry(() => import("./pages/Ventes")));
const Users = lazy(() => lazyRetry(() => import("./pages/Users")));
const Approbations = lazy(() => lazyRetry(() => import("./pages/Approbations")));
const Alertes = lazy(() => lazyRetry(() => import("./pages/Alertes")));
const Rapports = lazy(() => lazyRetry(() => import("./pages/Rapports")));
const Journal = lazy(() => lazyRetry(() => import("./pages/Journal")));
const Fournisseurs = lazy(() => lazyRetry(() => import("./pages/Fournisseurs")));
const Pointage = lazy(() => lazyRetry(() => import("./pages/Pointage")));
const Securite = lazy(() => lazyRetry(() => import("./pages/Securite")));
const Prestataires = lazy(() => lazyRetry(() => import("./pages/Prestataires")));
const Paiements = lazy(() => lazyRetry(() => import("./pages/Paiements")));
const Rapprochement = lazy(() => lazyRetry(() => import("./pages/Rapprochement")));
const DriverView = lazy(() => lazyRetry(() => import("./pages/DriverView")));
const Maintenance = lazy(() => lazyRetry(() => import("./pages/Maintenance")));
const AuditSuperviseur = lazy(() => lazyRetry(() => import("./pages/AuditSuperviseur")));
const AuditExterne = lazy(() => lazyRetry(() => import("./pages/AuditExterne")));
const SecurityDashboard = lazy(() => lazyRetry(() => import("./pages/SecurityDashboard")));
const ClientTracking = lazy(() => lazyRetry(() => import("./pages/ClientTracking")));
const AideSupport = lazy(() => lazyRetry(() => import("./pages/AideSupport")));
const Analytics = lazy(() => lazyRetry(() => import("./pages/Analytics")));
const LeadScoring = lazy(() => lazyRetry(() => import("./pages/LeadScoring")));
const SuccessStories = lazy(() => lazyRetry(() => import("./pages/SuccessStories")));
const Settings = lazy(() => lazyRetry(() => import("./pages/Settings")));
const Contracts = lazy(() => lazyRetry(() => import("./pages/Contracts")));
const ModeFormation = lazy(() => lazyRetry(() => import("./pages/ModeFormation")));
const Creances = lazy(() => lazyRetry(() => import("./pages/Creances")));
const Dettes = lazy(() => lazyRetry(() => import("./pages/Dettes")));
const Prets = lazy(() => lazyRetry(() => import("./pages/Prets")));
const Immobilisations = lazy(() => lazyRetry(() => import("./pages/Immobilisations")));
const UserProfile = lazy(() => lazyRetry(() => import("./pages/UserProfile")));
const AIAssistant = lazy(() => lazyRetry(() => import("./pages/AIAssistant")));
const WS7Import = lazy(() => lazyRetry(() => import("./pages/WS7Import")));
const WS7Batches = lazy(() => lazyRetry(() => import("./pages/WS7Batches")));
const WS7Discovery = lazy(() => lazyRetry(() => import("./pages/WS7Discovery")));
const Surveillance = lazy(() => lazyRetry(() => import("./pages/Surveillance")));
const AnalyticsBI = lazy(() => lazyRetry(() => import("./pages/AnalyticsBI")));
const AdvancedAnalytics = lazy(() => lazyRetry(() => import("./pages/AdvancedAnalytics")));
const InstallApp = lazy(() => lazyRetry(() => import("./pages/InstallApp")));
const IndustryBenchmarking = lazy(() => lazyRetry(() => import("./pages/IndustryBenchmarking")));
const WorkflowAutomation = lazy(() => lazyRetry(() => import("./pages/WorkflowAutomation")));
const PredictiveMaintenance = lazy(() => lazyRetry(() => import("./pages/PredictiveMaintenance")));
const MobileField = lazy(() => lazyRetry(() => import("./pages/MobileField")));
const TrainingAcademy = lazy(() => lazyRetry(() => import("./pages/TrainingAcademy")));
const CommunityForum = lazy(() => lazyRetry(() => import("./pages/CommunityForum")));
const OperationsAgent = lazy(() => lazyRetry(() => import("./pages/OperationsAgent")));
const ArchiveLivraisons = lazy(() => lazyRetry(() => import("./pages/ArchiveLivraisons")));
const TestGuide = lazy(() => lazyRetry(() => import("./pages/TestGuide")));
const DesignGuardian = lazy(() => lazyRetry(() => import("./pages/DesignGuardian")));
const CyberSecurity = lazy(() => lazyRetry(() => import("./pages/CyberSecurity")));
const Platform = lazy(() => lazyRetry(() => import("./pages/Platform")));
const InnovationHub = lazy(() => lazyRetry(() => import("./pages/InnovationHub")));
const AIInnovationEngine = lazy(() => lazyRetry(() => import("./pages/AIInnovationEngine")));
const AutonomousInnovator = lazy(() => lazyRetry(() => import("./pages/AutonomousInnovator")));
const IndustrialOracle = lazy(() => lazyRetry(() => import("./pages/IndustrialOracle")));
const OmniscientOptimizer = lazy(() => lazyRetry(() => import("./pages/OmniscientOptimizer")));
const CreativeCoPilot = lazy(() => lazyRetry(() => import("./pages/CreativeCoPilot")));
const SimulationSage = lazy(() => lazyRetry(() => import("./pages/SimulationSage")));
const VisionaryStrategist = lazy(() => lazyRetry(() => import("./pages/VisionaryStrategist")));
const MasterInventor = lazy(() => lazyRetry(() => import("./pages/MasterInventor")));
const InnovationCoach = lazy(() => lazyRetry(() => import("./pages/InnovationCoach")));
const OmniscientMarketMaven = lazy(() => lazyRetry(() => import("./pages/OmniscientMarketMaven")));
const InnovationPortfolioMastermind = lazy(() => lazyRetry(() => import("./pages/InnovationPortfolioMastermind")));
const IPAlchemist = lazy(() => lazyRetry(() => import("./pages/IPAlchemist")));
const InnovationFusionReactor = lazy(() => lazyRetry(() => import("./pages/InnovationFusionReactor")));
const EmergentInnovator = lazy(() => lazyRetry(() => import("./pages/EmergentInnovator")));
const RealitySculptor = lazy(() => lazyRetry(() => import("./pages/RealitySculptor")));
const EmpathicInnovator = lazy(() => lazyRetry(() => import("./pages/EmpathicInnovator")));
const Dreamweaver = lazy(() => lazyRetry(() => import("./pages/Dreamweaver")));
const OmniversalCreator = lazy(() => lazyRetry(() => import("./pages/OmniversalCreator")));
const SynesthesiaSavant = lazy(() => lazyRetry(() => import("./pages/SynesthesiaSavant")));
const QuantumQuester = lazy(() => lazyRetry(() => import("./pages/QuantumQuester")));
const OracleOrganicity = lazy(() => lazyRetry(() => import("./pages/OracleOrganicity")));
const ChronosCatalyst = lazy(() => lazyRetry(() => import("./pages/ChronosCatalyst")));
const HyperdimensionalHelmsman = lazy(() => lazyRetry(() => import("./pages/HyperdimensionalHelmsman")));
const NeuroNomad = lazy(() => lazyRetry(() => import("./pages/NeuroNomad")));
const CosmicComedian = lazy(() => lazyRetry(() => import("./pages/CosmicComedian")));
const EmpathicEvolutioneer = lazy(() => lazyRetry(() => import("./pages/EmpathicEvolutioneer")));
const SymbioticStoryteller = lazy(() => lazyRetry(() => import("./pages/SymbioticStoryteller")));
const QuantumQualiaQuaestor = lazy(() => lazyRetry(() => import("./pages/QuantumQualiaQuaestor")));
const AstroArchetypalArchitect = lazy(() => lazyRetry(() => import("./pages/AstroArchetypalArchitect")));
const TransDimensionalTranslator = lazy(() => lazyRetry(() => import("./pages/TransDimensionalTranslator")));
const NeuroFractalNavigator = lazy(() => lazyRetry(() => import("./pages/NeuroFractalNavigator")));
const ChronoSynergeticSymbiont = lazy(() => lazyRetry(() => import("./pages/ChronoSynergeticSymbiont")));
const XenoEmpathicXenoformer = lazy(() => lazyRetry(() => import("./pages/XenoEmpathicXenoformer")));
const PsychoSemanticSynesthete = lazy(() => lazyRetry(() => import("./pages/PsychoSemanticSynesthete")));
const GeoTemporalTerraformer = lazy(() => lazyRetry(() => import("./pages/GeoTemporalTerraformer")));
const CognitiveCrucible = lazy(() => lazyRetry(() => import("./pages/CognitiveCrucible")));
const EmpathicGauntlet = lazy(() => lazyRetry(() => import("./pages/EmpathicGauntlet")));
const RealityRazor = lazy(() => lazyRetry(() => import("./pages/RealityRazor")));
const ContextualChameleon = lazy(() => lazyRetry(() => import("./pages/ContextualChameleon")));
const FailureFiesta = lazy(() => lazyRetry(() => import("./pages/FailureFiesta")));
const BoundaryBreaker = lazy(() => lazyRetry(() => import("./pages/BoundaryBreaker")));

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
                     <Route path="/test-guide" element={<TestGuide />} />
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
                     <Route path="/design-guardian" element={<DesignGuardian />} />
                     <Route path="/cyber-security" element={<CyberSecurity />} />
                     <Route path="/platform" element={<Platform />} />
                     <Route path="/innovation" element={<InnovationHub />} />
                     <Route path="/ai-engine" element={<AIInnovationEngine />} />
                     <Route path="/autonomous-innovator" element={<AutonomousInnovator />} />
                     <Route path="/industrial-oracle" element={<IndustrialOracle />} />
                     <Route path="/omniscient-optimizer" element={<OmniscientOptimizer />} />
                     <Route path="/creative-copilot" element={<CreativeCoPilot />} />
                     <Route path="/simulation-sage" element={<SimulationSage />} />
                     <Route path="/visionary-strategist" element={<VisionaryStrategist />} />
                     <Route path="/master-inventor" element={<MasterInventor />} />
                     <Route path="/innovation-coach" element={<InnovationCoach />} />
                     <Route path="/market-maven" element={<OmniscientMarketMaven />} />
                     <Route path="/portfolio-mastermind" element={<InnovationPortfolioMastermind />} />
                     <Route path="/ip-alchemist" element={<IPAlchemist />} />
                     <Route path="/fusion-reactor" element={<InnovationFusionReactor />} />
                     <Route path="/emergent-innovator" element={<EmergentInnovator />} />
                     <Route path="/reality-sculptor" element={<RealitySculptor />} />
                     <Route path="/empathic-innovator" element={<EmpathicInnovator />} />
                     <Route path="/dreamweaver" element={<Dreamweaver />} />
                     <Route path="/omniversal-creator" element={<OmniversalCreator />} />
                     <Route path="/synesthesia-savant" element={<SynesthesiaSavant />} />
                     <Route path="/quantum-quester" element={<QuantumQuester />} />
                     <Route path="/oracle-organicity" element={<OracleOrganicity />} />
                     <Route path="/chronos-catalyst" element={<ChronosCatalyst />} />
                     <Route path="/hyperdimensional-helmsman" element={<HyperdimensionalHelmsman />} />
                     <Route path="/neuro-nomad" element={<NeuroNomad />} />
                     <Route path="/cosmic-comedian" element={<CosmicComedian />} />
                     <Route path="/empathic-evolutioneer" element={<EmpathicEvolutioneer />} />
                     <Route path="/symbiotic-storyteller" element={<SymbioticStoryteller />} />
                     <Route path="/quantum-qualia-quaestor" element={<QuantumQualiaQuaestor />} />
                     <Route path="/astro-archetypal-architect" element={<AstroArchetypalArchitect />} />
                     <Route path="/trans-dimensional-translator" element={<TransDimensionalTranslator />} />
                     <Route path="/neuro-fractal-navigator" element={<NeuroFractalNavigator />} />
                     <Route path="/chrono-synergetic-symbiont" element={<ChronoSynergeticSymbiont />} />
                     <Route path="/xeno-empathic-xenoformer" element={<XenoEmpathicXenoformer />} />
                     <Route path="/psycho-semantic-synesthete" element={<PsychoSemanticSynesthete />} />
                     <Route path="/geo-temporal-terraformer" element={<GeoTemporalTerraformer />} />
                     <Route path="/cognitive-crucible" element={<CognitiveCrucible />} />
                     <Route path="/empathic-gauntlet" element={<EmpathicGauntlet />} />
                     <Route path="/reality-razor" element={<RealityRazor />} />
                     <Route path="/contextual-chameleon" element={<ContextualChameleon />} />
                     <Route path="/failure-fiesta" element={<FailureFiesta />} />
                     <Route path="/boundary-breaker" element={<BoundaryBreaker />} />
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
