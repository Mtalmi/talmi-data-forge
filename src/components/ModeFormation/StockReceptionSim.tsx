// Stock Reception Simulation - God-Tier Two-Step Quality Check Workflow
// Technical Approval MUST come before Front Desk Validation
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  CheckCircle2,
  RotateCcw,
  X,
  ArrowRight,
  Shield,
  Users,
  Lock,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TechnicalQualityCheck,
  FrontDeskValidation,
  QualityCheckData,
  VerificationFormData,
  RejectionFormData,
  StockReceptionOrder,
} from './QualityCheckWorkflow';

interface StockReceptionSimProps {
  onComplete: () => void;
  onClose: () => void;
}

const DEMO_ORDER: StockReceptionOrder = {
  id: 'DEMO-SAND-001',
  supplier: 'Carrière de Sable Premium',
  material: 'Sable (Sand)',
  quantity: 10,
  unit: 'Tonnes',
  unitPrice: 250,
  date: new Date().toLocaleDateString('fr-FR'),
};

type WorkflowPhase = 'intro' | 'technical_check' | 'front_desk' | 'complete';

export function StockReceptionSim({ onComplete, onClose }: StockReceptionSimProps) {
  const [phase, setPhase] = useState<WorkflowPhase>('intro');
  const [qualityCheckData, setQualityCheckData] = useState<QualityCheckData | null>(null);
  const [finalData, setFinalData] = useState<{
    quantity: number;
    verification?: VerificationFormData;
    rejection?: RejectionFormData;
  } | null>(null);

  const handleTechnicalCheckComplete = (data: QualityCheckData) => {
    setQualityCheckData(data);
    toast.info('🔄 Transmission à l\'accueil pour validation...');
    setTimeout(() => {
      setPhase('front_desk');
    }, 1000);
  };

  const handleFrontDeskComplete = (
    confirmedQuantity: number,
    verificationForm?: VerificationFormData,
    rejectionForm?: RejectionFormData
  ) => {
    setFinalData({
      quantity: confirmedQuantity,
      verification: verificationForm,
      rejection: rejectionForm,
    });

    // Log complete audit trail
    console.log('[AUDIT_TRAIL] Complete Stock Reception:', {
      order: DEMO_ORDER,
      qualityCheck: qualityCheckData,
      validation: {
        quantity: confirmedQuantity,
        verificationForm,
        rejectionForm,
      },
      timestamp: new Date().toISOString(),
    });

    if (rejectionForm) {
      toast.info('📋 Réception marquée comme REJETÉE');
    } else {
      toast.success('🎉 Réception de stock complétée avec succès!', {
        description: `Commande ${DEMO_ORDER.id} - ${confirmedQuantity} ${DEMO_ORDER.unit}`,
      });
    }

    setPhase('complete');
  };

  const handleReset = () => {
    setPhase('intro');
    setQualityCheckData(null);
    setFinalData(null);
  };

  const handleFinish = () => {
    onComplete();
  };

  // Progress calculation
  const getProgress = () => {
    switch (phase) {
      case 'intro': return 10;
      case 'technical_check': return 40;
      case 'front_desk': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'intro': return 'Introduction';
      case 'technical_check': return 'Phase 1: Contrôle Qualité';
      case 'front_desk': return 'Phase 2: Validation Accueil';
      case 'complete': return 'Terminé';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full p-4 sm:p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Package className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Simulation: Réception Stock</h2>
              <p className="text-xs text-muted-foreground">
                Two-Step Quality Check - Conflict Prevention
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
              SANDBOX
            </Badge>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{getPhaseLabel()}</span>
          </div>
          <Progress value={getProgress()} className="h-2" indicatorClassName="bg-amber-500" />
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl mx-auto w-full">
          {/* Introduction Phase */}
          {phase === 'intro' && (
            <div className="space-y-6 animate-fade-in">
              {/* GOD-TIER Workflow Overview */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-amber-500/20">
                    <Shield className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100">
                      🔐 GOD-TIER Two-Step Approval
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Technical Approval MUST Come First
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Phase 1 - REQUIRED */}
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
                        ÉTAPE 1 (REQUISE)
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Approbation Technique
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                      Responsable: <strong>Abdel Sadek</strong> ou <strong>Karim</strong>
                    </p>
                    <ul className="text-xs space-y-1 text-blue-600 dark:text-blue-400">
                      <li>• Test d'humidité du sable</li>
                      <li>• Inspection du gravier</li>
                      <li>• Évaluation qualité globale</li>
                    </ul>
                  </div>

                  {/* Phase 2 - BLOCKED until Phase 1 */}
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 relative">
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-red-500/20 text-red-700 border-red-300 gap-1">
                        <Lock className="h-3 w-3" />
                        BLOQUÉE
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300">
                        ÉTAPE 2 (BLOQUÉE)
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                      Validation Front Desk
                    </h4>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                      Responsable: Personnel Accueil
                    </p>
                    <div className="p-2 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 mt-2">
                      <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        En attente de l'étape 1
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CRITICAL ENFORCEMENT RULES */}
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <h4 className="font-semibold flex items-center gap-2 mb-3 text-red-800 dark:text-red-200">
                  <Lock className="h-4 w-4" />
                  Règles d'Enforcement (AUCUNE Exception)
                </h4>
                <ul className="text-sm space-y-2 text-red-700 dark:text-red-300">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 mt-0.5 text-red-500" />
                    <span><strong>Front Desk BLOQUÉ</strong> jusqu'à approbation technique</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 mt-0.5 text-red-500" />
                    <span><strong>Pas de bypass</strong> d'urgence pour ce workflow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500" />
                    <span>Seul <strong>Abdel Sadek</strong> ou <strong>Karim</strong> peut débloquer</span>
                  </li>
                </ul>
              </div>

              {/* Order Info */}
              <div className="p-4 rounded-lg bg-background border">
                <h4 className="font-semibold mb-3">Commande à traiter:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">N° Commande:</span>
                    <p className="font-mono font-bold text-amber-600">{DEMO_ORDER.id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fournisseur:</span>
                    <p className="font-medium">{DEMO_ORDER.supplier}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Matériau:</span>
                    <p className="font-medium">{DEMO_ORDER.material}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantité:</span>
                    <p className="font-bold">{DEMO_ORDER.quantity} {DEMO_ORDER.unit}</p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full gap-2 bg-amber-500 hover:bg-amber-600"
                onClick={() => setPhase('technical_check')}
              >
                Commencer le Workflow (Phase 1: Tech)
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Technical Quality Check Phase */}
          {phase === 'technical_check' && (
            <TechnicalQualityCheck
              order={DEMO_ORDER}
              onComplete={handleTechnicalCheckComplete}
            />
          )}

          {/* Front Desk Validation Phase */}
          {phase === 'front_desk' && qualityCheckData && (
            <FrontDeskValidation
              order={DEMO_ORDER}
              qualityCheck={qualityCheckData}
              onComplete={handleFrontDeskComplete}
            />
          )}

          {/* Completion Phase */}
          {phase === 'complete' && (
            <div className="space-y-6 animate-fade-in">
              <div className={`p-6 rounded-xl border ${
                finalData?.rejection 
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                  : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-full ${
                    finalData?.rejection 
                      ? 'bg-red-100 dark:bg-red-900/50' 
                      : 'bg-emerald-100 dark:bg-emerald-900/50'
                  }`}>
                    <CheckCircle2 className={`h-8 w-8 ${
                      finalData?.rejection ? 'text-red-600' : 'text-emerald-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-xl ${
                      finalData?.rejection 
                        ? 'text-red-900 dark:text-red-100' 
                        : 'text-emerald-900 dark:text-emerald-100'
                    }`}>
                      {finalData?.rejection ? 'Réception Rejetée' : 'Réception Validée!'}
                    </h3>
                    <p className={`text-sm ${
                      finalData?.rejection 
                        ? 'text-red-700 dark:text-red-300' 
                        : 'text-emerald-700 dark:text-emerald-300'
                    }`}>
                      Workflow Two-Step complété avec succès
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-3 p-4 rounded-lg bg-background border">
                  <h4 className="font-semibold text-sm">Résumé du Workflow:</h4>
                  
                  {/* Phase 1 Summary */}
                  <div className="flex items-start gap-2 text-sm">
                    <Badge className="bg-blue-500/20 text-blue-700 shrink-0">Phase 1</Badge>
                    <div>
                      <p className="font-medium">Contrôle Qualité: {qualityCheckData?.technician}</p>
                      <p className="text-muted-foreground text-xs">
                        Humidité: {qualityCheckData?.humidity.reading}% | 
                        Gravier: {qualityCheckData?.gravel.grade} | 
                        Status: {qualityCheckData?.status === 'conforme' ? '✅ Conforme' : 
                                 qualityCheckData?.status === 'a_verifier' ? '⚠️ À vérifier' : '❌ Non-conforme'}
                      </p>
                    </div>
                  </div>

                  {/* Phase 2 Summary */}
                  <div className="flex items-start gap-2 text-sm">
                    <Badge className="bg-purple-500/20 text-purple-700 shrink-0">Phase 2</Badge>
                    <div>
                      <p className="font-medium">Validation: Front Desk</p>
                      <p className="text-muted-foreground text-xs">
                        {finalData?.rejection 
                          ? `Rejeté - ${finalData.rejection.recommendedAction === 'return_to_supplier' ? 'Retour fournisseur' : 
                              finalData.rejection.recommendedAction === 'partial_use' ? 'Utilisation partielle' : 'Inspection supplémentaire'}`
                          : `Quantité: ${finalData?.quantity} ${DEMO_ORDER.unit} | Total: ${((finalData?.quantity || 0) * DEMO_ORDER.unitPrice).toLocaleString()} DH`}
                      </p>
                    </div>
                  </div>

                  {/* Forms if any */}
                  {finalData?.verification && (
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">Formulaire de Vérification soumis</p>
                      <p>Action: {finalData.verification.recommendedAction}</p>
                    </div>
                  )}
                  
                  {finalData?.rejection && (
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">Formulaire de Rejet soumis</p>
                      <p>Raison: {finalData.rejection.reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Audit Log */}
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                  [AUDIT_TRAIL] {DEMO_ORDER.id} | Tech: {qualityCheckData?.technician} | 
                  Status: {qualityCheckData?.status} | 
                  Qty: {finalData?.quantity} {DEMO_ORDER.unit} | 
                  {finalData?.rejection ? 'REJECTED' : 'VALIDATED'}
                </p>
              </div>

              <Button
                className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600"
                onClick={handleFinish}
              >
                <CheckCircle2 className="h-4 w-4" />
                Terminer la Simulation
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
