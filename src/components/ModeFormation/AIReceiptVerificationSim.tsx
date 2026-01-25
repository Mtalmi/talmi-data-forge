import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Shield, 
  Lock,
  FileText,
  Camera,
  Loader2,
  ArrowRight,
  Eye,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface SimulationProps {
  onComplete: () => void;
  onClose: () => void;
}

// Demo scenarios
type VerificationScenario = 'confirmed' | 'discrepancy' | 'failed';

interface ExtractedData {
  amount: number;
  date: string;
  supplier: string;
  quantity: string;
  unitPrice: number;
  invoiceNumber: string;
  confidence: number;
}

interface EnteredData {
  amount: number;
  date: string;
  supplier: string;
  quantity: string;
  unitPrice: number;
}

// Role types for the simulation
type UserRole = 'front_desk' | 'karim' | 'owner' | 'abdel_sadek' | 'manager';

const ROLE_LABELS: Record<UserRole, string> = {
  front_desk: 'Accueil (Front Desk)',
  karim: 'Karim (Superviseur)',
  owner: 'Vous (Propriétaire)',
  abdel_sadek: 'Abdel Sadek (Resp. Technique)',
  manager: 'Manager',
};

const CAN_OVERRIDE: UserRole[] = ['karim', 'owner', 'manager'];

// Demo data for each scenario
const SCENARIO_DATA: Record<VerificationScenario, { extracted: ExtractedData; entered: EnteredData; matchPercent: number }> = {
  confirmed: {
    extracted: {
      amount: 2500,
      date: '2026-01-25',
      supplier: 'Carrière de Sable Premium',
      quantity: '10 Tonnes',
      unitPrice: 250,
      invoiceNumber: 'INV-2026-001',
      confidence: 98,
    },
    entered: {
      amount: 2500,
      date: '2026-01-25',
      supplier: 'Carrière de Sable Premium',
      quantity: '10 Tonnes',
      unitPrice: 250,
    },
    matchPercent: 99,
  },
  discrepancy: {
    extracted: {
      amount: 2500,
      date: '2026-01-25',
      supplier: 'Carrière de Sable Premium',
      quantity: '10 Tonnes',
      unitPrice: 250,
      invoiceNumber: 'INV-2026-002',
      confidence: 82,
    },
    entered: {
      amount: 2600,
      date: '2026-01-25',
      supplier: 'Carrière Premium',
      quantity: '10 Tonnes',
      unitPrice: 260,
    },
    matchPercent: 72,
  },
  failed: {
    extracted: {
      amount: 2500,
      date: '2026-01-25',
      supplier: 'Unknown Supplier',
      quantity: '10 Tonnes',
      unitPrice: 250,
      invoiceNumber: 'INV-2026-003',
      confidence: 68,
    },
    entered: {
      amount: 3500,
      date: '2026-01-26',
      supplier: 'Carrière Premium',
      quantity: '15 Tonnes',
      unitPrice: 233,
    },
    matchPercent: 45,
  },
};

export function AIReceiptVerificationSim({ onComplete, onClose }: SimulationProps) {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('front_desk');
  const [selectedScenario, setSelectedScenario] = useState<VerificationScenario>('confirmed');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLevel, setOverrideLevel] = useState<string>('');
  const [overrideApproved, setOverrideApproved] = useState(false);
  const [auditLog, setAuditLog] = useState<string[]>([]);

  const canOverride = CAN_OVERRIDE.includes(selectedRole);
  const scenarioData = SCENARIO_DATA[selectedScenario];

  const addAuditLog = useCallback((entry: string) => {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    setAuditLog(prev => [...prev, `[${timestamp}] ${entry}`]);
  }, []);

  const simulateAIProcessing = useCallback(() => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setVerificationComplete(true);
          addAuditLog(`[AI_VERIFICATION] Scenario: ${selectedScenario.toUpperCase()} | Match: ${scenarioData.matchPercent}% | Confidence: ${scenarioData.extracted.confidence}%`);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  }, [selectedScenario, scenarioData, addAuditLog]);

  const handleOverrideSubmit = () => {
    if (!overrideReason.trim() || !overrideLevel) {
      toast.error('Raison et niveau d\'approbation requis');
      return;
    }
    
    setOverrideApproved(true);
    setShowOverrideModal(false);
    addAuditLog(`[OVERRIDE] Approved by: ${ROLE_LABELS[selectedRole]} | Reason: ${overrideReason} | Level: ${overrideLevel}`);
    toast.success('✅ Approbation enregistrée - Restriction levée');
  };

  const handleComplete = () => {
    addAuditLog(`[VALIDATION] Receipt validated by: ${ROLE_LABELS[selectedRole]}`);
    toast.success('🎉 Simulation terminée avec succès!');
    onComplete();
  };

  const renderRoleSelection = () => (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCheck className="h-5 w-5 text-primary" />
          Étape 1: Sélectionnez votre rôle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choisissez un rôle pour tester les différents niveaux d'accès du système de vérification AI.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
            <Button
              key={role}
              variant={selectedRole === role ? 'default' : 'outline'}
              className={cn(
                'h-auto py-3 justify-start',
                selectedRole === role && 'ring-2 ring-primary'
              )}
              onClick={() => setSelectedRole(role)}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-semibold">{ROLE_LABELS[role]}</span>
                <span className="text-xs opacity-70">
                  {CAN_OVERRIDE.includes(role) ? '✅ Peut annuler restrictions' : '❌ Bloqué si discordance'}
                </span>
              </div>
            </Button>
          ))}
        </div>

        <Button onClick={() => setStep(2)} className="w-full mt-4">
          Continuer <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderScenarioSelection = () => (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-amber-500" />
          Étape 2: Sélectionnez un scénario de test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Testez les trois résultats possibles de la vérification AI.
        </p>
        
        <div className="space-y-3">
          <Button
            variant={selectedScenario === 'confirmed' ? 'default' : 'outline'}
            className={cn(
              'w-full h-auto py-4 justify-start',
              selectedScenario === 'confirmed' && 'bg-green-600 hover:bg-green-700'
            )}
            onClick={() => setSelectedScenario('confirmed')}
          >
            <CheckCircle2 className="h-5 w-5 mr-3" />
            <div className="text-left">
              <p className="font-semibold">✅ CONFIRMÉ (99% match)</p>
              <p className="text-xs opacity-80">Toutes les données correspondent - Validation autorisée</p>
            </div>
          </Button>

          <Button
            variant={selectedScenario === 'discrepancy' ? 'default' : 'outline'}
            className={cn(
              'w-full h-auto py-4 justify-start',
              selectedScenario === 'discrepancy' && 'bg-amber-600 hover:bg-amber-700'
            )}
            onClick={() => setSelectedScenario('discrepancy')}
          >
            <AlertTriangle className="h-5 w-5 mr-3" />
            <div className="text-left">
              <p className="font-semibold">⚠️ DISCORDANCE (72% match)</p>
              <p className="text-xs opacity-80">Différences mineures détectées - Override possible</p>
            </div>
          </Button>

          <Button
            variant={selectedScenario === 'failed' ? 'default' : 'outline'}
            className={cn(
              'w-full h-auto py-4 justify-start',
              selectedScenario === 'failed' && 'bg-red-600 hover:bg-red-700'
            )}
            onClick={() => setSelectedScenario('failed')}
          >
            <XCircle className="h-5 w-5 mr-3" />
            <div className="text-left">
              <p className="font-semibold">❌ ÉCHEC (45% match)</p>
              <p className="text-xs opacity-80">Discordances critiques - Possible fraude</p>
            </div>
          </Button>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
            Retour
          </Button>
          <Button onClick={() => setStep(3)} className="flex-1">
            Continuer <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderUploadStep = () => (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="h-5 w-5 text-primary" />
          Étape 3: Télécharger Facture / Reçu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center bg-primary/5">
          <Camera className="h-12 w-12 mx-auto text-primary/50 mb-4" />
          <p className="font-semibold mb-2">📷 Télécharger Image ou Prendre Photo</p>
          <p className="text-sm text-muted-foreground mb-4">
            Formats acceptés: JPG, PNG, PDF | Taille max: 10 MB
          </p>
          <Button 
            onClick={() => {
              toast.success('📷 Facture téléchargée (Simulation)');
              addAuditLog(`[UPLOAD] Receipt uploaded by: ${ROLE_LABELS[selectedRole]}`);
              setStep(4);
            }}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Simuler Upload
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
            Retour
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderProcessingStep = () => (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary animate-pulse" />
          Étape 4: Vérification IA en cours...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isProcessing && !verificationComplete && (
          <Button onClick={simulateAIProcessing} className="w-full">
            <Bot className="mr-2 h-4 w-4" />
            Lancer Vérification IA
          </Button>
        )}

        {isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">
                {processingProgress < 40 && '⏳ Extraction des données...'}
                {processingProgress >= 40 && processingProgress < 70 && '⏳ Comparaison avec données saisies...'}
                {processingProgress >= 70 && '⏳ Analyse de confiance...'}
              </span>
            </div>
            <Progress value={processingProgress} className="h-3" />
            <p className="text-center text-sm text-muted-foreground">
              Veuillez patienter... {processingProgress}%
            </p>
          </div>
        )}

        {verificationComplete && (
          <div className="space-y-4">
            {renderVerificationResult()}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderVerificationResult = () => {
    const { extracted, entered, matchPercent } = scenarioData;
    const isConfirmed = selectedScenario === 'confirmed';
    const isDiscrepancy = selectedScenario === 'discrepancy';
    const isFailed = selectedScenario === 'failed';
    const isBlocked = !isConfirmed && !canOverride && !overrideApproved;
    const canProceed = isConfirmed || canOverride || overrideApproved;

    return (
      <div className="space-y-4">
        {/* Result Header */}
        <Alert className={cn(
          isConfirmed && 'border-green-500/50 bg-green-500/10',
          isDiscrepancy && 'border-amber-500/50 bg-amber-500/10',
          isFailed && 'border-red-500/50 bg-red-500/10'
        )}>
          <div className="flex items-center gap-2">
            {isConfirmed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {isDiscrepancy && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            {isFailed && <XCircle className="h-5 w-5 text-red-500" />}
            <AlertDescription className="font-semibold">
              {isConfirmed && '✅ FACTURE VÉRIFIÉE AVEC SUCCÈS'}
              {isDiscrepancy && '⚠️ DISCORDANCE DÉTECTÉE'}
              {isFailed && '❌ VÉRIFICATION ÉCHOUÉE - FACTURE SUSPECTE'}
            </AlertDescription>
          </div>
        </Alert>

        {/* Match Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Correspondance:</span>
            <span className="font-bold">{matchPercent}%</span>
          </div>
          <Progress 
            value={matchPercent} 
            className={cn(
              'h-4',
              isConfirmed && '[&>div]:bg-green-500',
              isDiscrepancy && '[&>div]:bg-amber-500',
              isFailed && '[&>div]:bg-red-500'
            )} 
          />
        </div>

        {/* Data Comparison */}
        <div className="bg-background/50 rounded-lg p-4 space-y-3">
          <p className="font-semibold text-sm mb-3">Données Extraites vs. Saisies:</p>
          
          <ComparisonRow 
            label="Montant" 
            extracted={`${extracted.amount.toLocaleString()} DH`}
            entered={`${entered.amount.toLocaleString()} DH`}
            match={extracted.amount === entered.amount}
          />
          <ComparisonRow 
            label="Date" 
            extracted={new Date(extracted.date).toLocaleDateString('fr-FR')}
            entered={new Date(entered.date).toLocaleDateString('fr-FR')}
            match={extracted.date === entered.date}
          />
          <ComparisonRow 
            label="Fournisseur" 
            extracted={extracted.supplier}
            entered={entered.supplier}
            match={extracted.supplier === entered.supplier}
          />
          <ComparisonRow 
            label="Quantité" 
            extracted={extracted.quantity}
            entered={entered.quantity}
            match={extracted.quantity === entered.quantity}
          />
          <ComparisonRow 
            label="Prix unitaire" 
            extracted={`${extracted.unitPrice} DH`}
            entered={`${entered.unitPrice} DH`}
            match={extracted.unitPrice === entered.unitPrice}
          />
        </div>

        {/* AI Confidence */}
        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
          <span className="text-sm">Confiance IA:</span>
          <Badge variant={extracted.confidence >= 85 ? 'default' : 'destructive'}>
            {extracted.confidence}%
          </Badge>
        </div>

        {/* Override Approved Badge */}
        {overrideApproved && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <Shield className="h-4 w-4 text-green-500" />
            <AlertDescription>
              ✅ <strong>APPROBATION ENREGISTRÉE</strong> - Restriction levée par {ROLE_LABELS[selectedRole]}
            </AlertDescription>
          </Alert>
        )}

        {/* Blocked Status for Front Desk */}
        {isBlocked && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <Lock className="h-4 w-4 text-red-500" />
            <AlertDescription>
              🔒 <strong>BLOQUÉ</strong> - L'accueil ne peut pas valider cette facture.
              <br />
              <span className="text-xs">Seul Karim ou le Propriétaire peuvent annuler cette restriction.</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {/* Override Button (for authorized roles only) */}
          {!isConfirmed && canOverride && !overrideApproved && (
            <Button 
              onClick={() => setShowOverrideModal(true)}
              variant="outline"
              className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
            >
              <Shield className="mr-2 h-4 w-4" />
              Annuler Restriction (Override)
            </Button>
          )}

          {/* Request Override Button (for blocked roles) */}
          {isBlocked && (
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => toast.info('📧 Demande envoyée à Karim et au Propriétaire')}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Demander Approbation Karim/Propriétaire
            </Button>
          )}

          {/* Validate Button */}
          <Button 
            onClick={handleComplete}
            disabled={!canProceed}
            className={cn(
              'w-full',
              canProceed ? 'bg-green-600 hover:bg-green-700' : ''
            )}
          >
            {canProceed ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Valider et Terminer Simulation
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Validation Bloquée
              </>
            )}
          </Button>

          {/* Try Another Scenario */}
          <Button 
            variant="ghost" 
            onClick={() => {
              setStep(2);
              setVerificationComplete(false);
              setOverrideApproved(false);
              setOverrideReason('');
              setOverrideLevel('');
            }}
            className="w-full"
          >
            <Eye className="mr-2 h-4 w-4" />
            Tester un autre scénario
          </Button>
        </div>
      </div>
    );
  };

  // Comparison row component
  const ComparisonRow = ({ 
    label, 
    extracted, 
    entered, 
    match 
  }: { 
    label: string; 
    extracted: string; 
    entered: string; 
    match: boolean;
  }) => (
    <div className="flex items-start gap-2 text-sm">
      {match ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <span className="font-medium">{label}:</span>
        <div className={cn(
          'text-xs mt-0.5',
          !match && 'text-red-500'
        )}>
          {extracted} {!match && <span className="text-muted-foreground">vs.</span>} {!match && entered}
          {match && <span className="text-green-500 ml-1">✓</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Vérification AI des Factures
          </h2>
          <p className="text-sm text-muted-foreground">
            Simulation du système de vérification automatique des reçus
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary/30">
          {ROLE_LABELS[selectedRole]}
        </Badge>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div 
            key={s}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              s <= step ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Current Step */}
      {step === 1 && renderRoleSelection()}
      {step === 2 && renderScenarioSelection()}
      {step === 3 && renderUploadStep()}
      {step === 4 && renderProcessingStep()}

      {/* Audit Log */}
      {auditLog.length > 0 && (
        <Card className="border-muted">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Journal d'Audit (Simulation)
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="bg-black/5 dark:bg-white/5 rounded p-3 font-mono text-xs space-y-1 max-h-32 overflow-y-auto">
              {auditLog.map((entry, i) => (
                <div key={i} className="text-muted-foreground">{entry}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exit Button */}
      <Button variant="ghost" onClick={onClose} className="w-full">
        Quitter la simulation
      </Button>

      {/* Override Modal */}
      <Dialog open={showOverrideModal} onOpenChange={setShowOverrideModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Demande d'Approbation - Annuler Restriction
            </DialogTitle>
            <DialogDescription>
              Facture: {scenarioData.extracted.invoiceNumber} | Montant: {scenarioData.extracted.amount.toLocaleString()} DH
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">
                Raison de l'approbation (OBLIGATOIRE)
              </Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Ex: Fournisseur a corrigé le prix, différence est acceptable, etc."
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">
                Niveau d'approbation (OBLIGATOIRE)
              </Label>
              <RadioGroup value={overrideLevel} onValueChange={setOverrideLevel}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="simple" id="simple" />
                  <Label htmlFor="simple" className="text-sm">
                    Approbation simple (Discordance mineure)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reserve" id="reserve" />
                  <Label htmlFor="reserve" className="text-sm">
                    Approbation avec réserve (Vérifier ultérieurement)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgence" id="urgence" />
                  <Label htmlFor="urgence" className="text-sm">
                    Approbation d'urgence (Situation critique)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowOverrideModal(false)} className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={handleOverrideSubmit}
              disabled={!overrideReason.trim() || !overrideLevel}
              className="flex-1"
            >
              <Shield className="mr-2 h-4 w-4" />
              Approuver et Continuer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
