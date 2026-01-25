import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  BookOpen,
  Trophy,
  RotateCcw,
  Star,
  Layers,
  Crown,
} from 'lucide-react';
import {
  SimulationCard,
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
  CeoOverrideSim,
  ForensicAnalysisSim,
  FinancialReportingSim,
  ClientManagementSim,
  SimulationType,
  SimulationTier,
  SimulationDifficulty,
} from '@/components/ModeFormation';
import { cn } from '@/lib/utils';

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
    description: 'Inspectez un lot, mesurez l\'affaissement et générez le rapport QC.',
    duration: '~5 min',
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
    description: 'Revue du trail d\'audit, vérification RLS et rapport de conformité.',
    duration: '~5 min',
    tier: 'advanced',
    difficulty: 'hard',
  },
  // Tier 3 - Executive
  {
    type: 'ceo_override',
    title: 'CEO Emergency Override',
    description: 'Générez un token 30 min, autorisez une transaction bloquée.',
    duration: '~4 min',
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
    icon: Star,
    description: 'Opérations quotidiennes essentielles',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500',
  },
  advanced: {
    title: 'Tier 2: Avancé',
    icon: Layers,
    description: 'Fonctions techniques et logistiques',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    iconColor: 'text-orange-500',
  },
  executive: {
    title: 'Tier 3: Direction',
    icon: Crown,
    description: 'Contrôle exécutif et analyse',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
    iconColor: 'text-rose-500',
  },
};

export default function ModeFormation() {
  const [completedSims, setCompletedSims] = useState<SimulationType[]>([]);
  const [activeSim, setActiveSim] = useState<SimulationType | null>(null);

  const handleComplete = (type: SimulationType) => {
    if (!completedSims.includes(type)) {
      setCompletedSims((prev) => [...prev, type]);
    }
    setActiveSim(null);
  };

  const handleReset = () => {
    setCompletedSims([]);
  };

  const progressPct = (completedSims.length / SIMULATIONS.length) * 100;
  const allComplete = completedSims.length === SIMULATIONS.length;

  const getSimsByTier = (tier: SimulationTier) => 
    SIMULATIONS.filter(sim => sim.tier === tier);

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
                14 simulations interactives - Aucune donnée réelle affectée
              </p>
            </div>
          </div>

          {completedSims.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Progress Card */}
        <div
          className={cn(
            'p-4 rounded-xl border transition-all',
            allComplete
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-700'
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {allComplete ? (
                <Trophy className="h-5 w-5 text-emerald-500" />
              ) : (
                <BookOpen className="h-5 w-5 text-amber-500" />
              )}
              <span className="font-medium">
                {allComplete ? '🎉 TBOS Certified Operator!' : 'Progression'}
              </span>
            </div>
            <span className="text-sm font-mono">
              {completedSims.length}/{SIMULATIONS.length}
            </span>
          </div>
          <Progress
            value={progressPct}
            className={cn(
              'h-2',
              allComplete ? '[&>div]:bg-emerald-500' : '[&>div]:bg-amber-500'
            )}
          />
          {allComplete && (
            <div className="mt-3 p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                🏆 Félicitations! Vous avez terminé toutes les simulations et êtes maintenant certifié opérateur TBOS.
              </p>
            </div>
          )}
        </div>

        {/* Simulation Tiers */}
        {(['core', 'advanced', 'executive'] as SimulationTier[]).map((tier) => {
          const config = TIER_CONFIG[tier];
          const TierIcon = config.icon;
          const tierSims = getSimsByTier(tier);
          const tierCompleted = tierSims.filter(s => completedSims.includes(s.type)).length;

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
                    tierCompleted === tierSims.length 
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-muted'
                  )}>
                    {tierCompleted}/{tierSims.length}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tierSims.map((sim) => (
                  <SimulationCard
                    key={sim.type}
                    type={sim.type}
                    title={sim.title}
                    description={sim.description}
                    duration={sim.duration}
                    difficulty={sim.difficulty}
                    isCompleted={completedSims.includes(sim.type)}
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
            <li>• Vous pouvez répéter chaque simulation autant de fois que nécessaire</li>
            <li>• Complétez les 14 simulations pour obtenir la certification TBOS</li>
          </ul>
        </div>
      </div>

      {/* Active Simulation Modal */}
      {renderSimModal()}
    </MainLayout>
  );
}
