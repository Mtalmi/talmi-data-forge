import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GraduationCap,
  BookOpen,
  Trophy,
  RotateCcw,
  Star,
  Layers,
  Crown,
  Lock,
  AlertCircle,
} from 'lucide-react';
import {
  SimulationCardWithRBAC,
  StockReceptionSim,
  ExpenseEntrySim,
  MidnightProtocolSim,
  CreateQuoteSim,
  ValidateDeliverySim,
  BudgetManagementSim,
  QualityControlSim,
  FleetPredatorSim,
  ProductionManagementSim,
  AuditComplianceSim,
  AIReceiptVerificationSim,
  CeoOverrideSim,
  ForensicAnalysisSim,
  FinancialReportingSim,
  ClientManagementSim,
  CertificationBadge,
  useFormationProgress,
  SimulationType,
  SimulationTier,
  SimulationDifficulty,
  canAccessSimulation,
  canAccessTier,
  TIER_SIMULATIONS,
  ROLE_DISPLAY_NAMES,
  AppRole,
} from '@/components/ModeFormation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SimulationConfig {
  type: SimulationType;
  title: string;
  description: string;
  duration: string;
  tier: SimulationTier;
  difficulty: SimulationDifficulty;
}

const SIMULATIONS: SimulationConfig[] = [
  // Tier 1 - Core
  {
    type: 'stock_reception',
    title: 'Réception Stock',
    description: 'Maîtrisez le workflow complet: commande, photo obligatoire, vérification quantités.',
    duration: '~5 min',
    tier: 'core',
    difficulty: 'easy',
  },
  {
    type: 'expense_entry',
    title: 'Saisie Dépense',
    description: 'Apprenez la gestion du budget 15k DH, catégories et justificatifs.',
    duration: '~4 min',
    tier: 'core',
    difficulty: 'easy',
  },
  {
    type: 'midnight_protocol',
    title: 'Le Protocole Minuit',
    description: 'Simulez une transaction hors-heures avec justification d\'urgence.',
    duration: '~3 min',
    tier: 'core',
    difficulty: 'medium',
  },
  {
    type: 'create_quote',
    title: 'Créer un Devis',
    description: 'Créez un devis client avec sélection produit et calcul automatique.',
    duration: '~4 min',
    tier: 'core',
    difficulty: 'easy',
  },
  {
    type: 'validate_delivery',
    title: 'Valider une Livraison',
    description: 'Workflow complet: quantités, qualité, signature, paiement.',
    duration: '~5 min',
    tier: 'core',
    difficulty: 'medium',
  },
  {
    type: 'budget_management',
    title: 'Gestion Budget',
    description: 'Analysez les catégories de dépenses, prévisions et alertes.',
    duration: '~4 min',
    tier: 'core',
    difficulty: 'easy',
  },
  // Tier 2 - Advanced
  {
    type: 'quality_control',
    title: 'Contrôle Qualité',
    description: 'Tests d\'humidité, granulométrie et validation Two-Step Handshake.',
    duration: '~6 min',
    tier: 'advanced',
    difficulty: 'medium',
  },
  {
    type: 'fleet_predator',
    title: 'Fleet Predator GPS',
    description: 'Surveillance véhicules, carburant, maintenance et geofencing.',
    duration: '~6 min',
    tier: 'advanced',
    difficulty: 'medium',
  },
  {
    type: 'production_management',
    title: 'Gestion Production',
    description: 'Créez un lot de béton, définissez les paramètres et suivez la production.',
    duration: '~5 min',
    tier: 'advanced',
    difficulty: 'medium',
  },
  {
    type: 'audit_compliance',
    title: 'Audit & Conformité',
    description: 'Vérification de conformité, rapports d\'audit et contrôle des processus.',
    duration: '~6 min',
    tier: 'advanced',
    difficulty: 'hard',
  },
  // Tier 3 - Executive
  {
    type: 'ai_receipt_verification',
    title: 'Vérification AI Factures',
    description: 'Testez le système OCR/AI qui vérifie automatiquement les factures avec contrôle de fraude.',
    duration: '~5 min',
    tier: 'executive',
    difficulty: 'medium',
  },
  {
    type: 'ceo_override',
    title: 'CEO Override (God Mode)',
    description: 'Bypass d\'urgence PDG: tokens de validation, dérogations et contrôle total.',
    duration: '~5 min',
    tier: 'executive',
    difficulty: 'hard',
  },
  {
    type: 'forensic_analysis',
    title: 'Analyse Forensique',
    description: 'Examinez les logs, comparez les changements, identifiez les anomalies.',
    duration: '~6 min',
    tier: 'executive',
    difficulty: 'hard',
  },
  {
    type: 'financial_reporting',
    title: 'Reporting Financier',
    description: 'Rapport journalier, analyse cash-flow, marges et prévisions.',
    duration: '~5 min',
    tier: 'executive',
    difficulty: 'hard',
  },
  {
    type: 'client_management',
    title: 'Gestion Clients',
    description: 'Créez un client, consultez l\'historique et suivez les créances.',
    duration: '~5 min',
    tier: 'executive',
    difficulty: 'medium',
  },
];

const TIER_CONFIG = {
  core: {
    title: 'Tier 1: Fondamentaux',
    subtitle: 'Obligatoire pour tous',
    icon: Star,
    description: 'Opérations quotidiennes essentielles',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500',
  },
  advanced: {
    title: 'Tier 2: Avancé',
    subtitle: 'Responsables de département',
    icon: Layers,
    description: 'Fonctions techniques et logistiques',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    iconColor: 'text-orange-500',
  },
  executive: {
    title: 'Tier 3: Direction',
    subtitle: 'PDG, DAF, Superviseur',
    icon: Crown,
    description: 'Contrôle exécutif et analyse',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
    iconColor: 'text-rose-500',
  },
};

export default function ModeFormation() {
  const [activeSim, setActiveSim] = useState<SimulationType | null>(null);
  
  const {
    userRole,
    completedSimulations,
    mandatoryProgress,
    certificationStatus,
    isFullyCertified,
    loading,
    completeSimulation,
    resetProgress,
    checkAndIssueCertification,
    canAccess,
    isCompleted,
  } = useFormationProgress();

  // Check for certification when progress changes
  useEffect(() => {
    if (certificationStatus === 'FULLY_CERTIFIED') {
      checkAndIssueCertification();
    }
  }, [certificationStatus, checkAndIssueCertification]);

  const handleComplete = async (type: SimulationType) => {
    const result = await completeSimulation(type);
    if (result.success) {
      toast.success('🎉 Simulation terminée!', {
        description: `Module "${SIMULATIONS.find(s => s.type === type)?.title}" complété avec succès.`,
      });
    }
    setActiveSim(null);
  };

  const handleReset = async () => {
    const result = await resetProgress();
    if (result.success) {
      toast.info('Progression réinitialisée', {
        description: 'Vous pouvez recommencer toutes les simulations.',
      });
    }
  };

  const getSimsByTier = (tier: SimulationTier) => 
    SIMULATIONS.filter(sim => sim.tier === tier);

  const getTierProgress = (tier: SimulationTier) => {
    const tierSims = getSimsByTier(tier);
    const accessibleSims = tierSims.filter(s => canAccess(s.type));
    const completedCount = accessibleSims.filter(s => isCompleted(s.type)).length;
    return { completed: completedCount, total: accessibleSims.length };
  };

  const hasTierAccess = (tier: SimulationTier) => {
    const tierSims = getSimsByTier(tier);
    return tierSims.some(s => canAccess(s.type));
  };

  const renderSimModal = () => {
    if (!activeSim) return null;
    
    const simProps = {
      onComplete: () => handleComplete(activeSim),
      onClose: () => setActiveSim(null),
    };

    switch (activeSim) {
      case 'stock_reception':
        return <StockReceptionSim {...simProps} />;
      case 'expense_entry':
        return <ExpenseEntrySim {...simProps} />;
      case 'midnight_protocol':
        return <MidnightProtocolSim {...simProps} />;
      case 'create_quote':
        return <CreateQuoteSim {...simProps} />;
      case 'validate_delivery':
        return <ValidateDeliverySim {...simProps} />;
      case 'budget_management':
        return <BudgetManagementSim {...simProps} />;
      case 'quality_control':
        return <QualityControlSim {...simProps} />;
      case 'fleet_predator':
        return <FleetPredatorSim {...simProps} />;
      case 'production_management':
        return <ProductionManagementSim {...simProps} />;
      case 'audit_compliance':
        return <AuditComplianceSim {...simProps} />;
      case 'ai_receipt_verification':
        return <AIReceiptVerificationSim {...simProps} />;
      case 'ceo_override':
        return <CeoOverrideSim {...simProps} />;
      case 'forensic_analysis':
        return <ForensicAnalysisSim {...simProps} />;
      case 'financial_reporting':
        return <FinancialReportingSim {...simProps} />;
      case 'client_management':
        return <ClientManagementSim {...simProps} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/10 flex items-center justify-center border border-amber-500/30">
              <GraduationCap className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Mode Formation
                <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  Sandbox
                </Badge>
              </h1>
              <p className="text-muted-foreground">
                {userRole 
                  ? `${ROLE_DISPLAY_NAMES[userRole as AppRole]} - Formation personnalisée`
                  : '14 simulations interactives - Aucune donnée réelle affectée'
                }
              </p>
            </div>
          </div>

          {completedSimulations.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Certification Status Card */}
        <CertificationBadge
          status={certificationStatus}
          progress={mandatoryProgress}
          userRole={userRole}
          showDownload={isFullyCertified}
        />

        {/* Simulation Tiers */}
        {(['core', 'advanced', 'executive'] as SimulationTier[]).map((tier) => {
          const config = TIER_CONFIG[tier];
          const TierIcon = config.icon;
          const tierSims = getSimsByTier(tier);
          const tierProgress = getTierProgress(tier);
          const hasAccess = hasTierAccess(tier);
          const isTierAccessible = tier === 'core' || canAccessTier(tier, completedSimulations);

          // If no access to any simulation in this tier and not core
          if (!hasAccess && tier !== 'core') {
            return (
              <div key={tier} className="space-y-4">
                <div className={cn(
                  'p-4 rounded-xl border opacity-60',
                  'bg-muted/30 border-muted'
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h2 className="font-semibold text-muted-foreground">{config.title}</h2>
                        <p className="text-sm text-muted-foreground">{config.subtitle}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-muted">
                      <Lock className="h-3 w-3 mr-1" />
                      Accès restreint
                    </Badge>
                  </div>
                </div>
              </div>
            );
          }

          // Tier not yet accessible (prerequisites not met)
          if (!isTierAccessible && hasAccess) {
            return (
              <div key={tier} className="space-y-4">
                <div className={cn(
                  'p-4 rounded-xl border',
                  config.bgColor,
                  config.borderColor,
                  'opacity-75'
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TierIcon className={cn('h-5 w-5', config.iconColor)} />
                      <div>
                        <h2 className="font-semibold">{config.title}</h2>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Complétez le Tier précédent
                    </Badge>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={tier} className="space-y-4">
              <div className={cn(
                'p-4 rounded-xl border',
                config.bgColor,
                config.borderColor
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TierIcon className={cn('h-5 w-5', config.iconColor)} />
                    <div>
                      <h2 className="font-semibold">{config.title}</h2>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    tierProgress.completed === tierProgress.total && tierProgress.total > 0
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-muted'
                  )}>
                    {tierProgress.completed}/{tierProgress.total}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tierSims.map((sim) => (
                  <SimulationCardWithRBAC
                    key={sim.type}
                    type={sim.type}
                    title={sim.title}
                    description={sim.description}
                    duration={sim.duration}
                    difficulty={sim.difficulty}
                    isCompleted={isCompleted(sim.type)}
                    userRole={userRole}
                    onStart={() => setActiveSim(sim.type)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Info Box */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <h3 className="font-medium flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            À propos du Mode Formation
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Toutes les données sont fictives (préfixe DEMO-)</li>
            <li>• Aucune écriture en base de données</li>
            <li>• Les logs affichent le préfixe "SIMULATION"</li>
            <li>• L'accès aux simulations dépend de votre rôle</li>
            <li>• Complétez les modules obligatoires pour la certification TBOS</li>
          </ul>
        </div>
      </div>

      {/* Active Simulation Modal */}
      {renderSimModal()}
    </MainLayout>
  );
}
