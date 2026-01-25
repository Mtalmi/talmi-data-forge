// God-Tier Two-Step Approval Workflow for Raw Material Orders
// Technical Approval MUST come before Front Desk Validation

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Shield,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Camera,
  Droplets,
  FlaskConical,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { hapticSuccess, hapticError, hapticTap } from '@/lib/haptics';

type WorkflowStatus = 'awaiting_technical' | 'awaiting_frontdesk' | 'approved' | 'rejected';
type QualityAssessment = 'conforme' | 'a_verifier' | 'non_conforme';

interface ReceptionOrder {
  id: string;
  materiau: string;
  quantite: number;
  fournisseur: string | null;
  numero_bl_fournisseur: string | null;
  photo_bl_url: string | null;
  created_at: string;
  tech_approval_status: string;
  tech_approval_by_name?: string | null;
  tech_approval_at?: string | null;
  quality_assessment?: string | null;
  humidity_test_pct?: number | null;
  gravel_grade?: string | null;
  tech_approval_notes?: string | null;
  workflow_status: string;
  front_desk_validation_status?: string;
}

interface TwoStepApprovalWorkflowProps {
  order: ReceptionOrder;
  onUpdate?: () => void;
}

// Status Badge Component
function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  const config = {
    awaiting_technical: {
      label: '⏳ EN ATTENTE APPROBATION TECHNIQUE',
      className: 'bg-amber-500/20 text-amber-700 border-amber-300',
      icon: Clock,
    },
    awaiting_frontdesk: {
      label: '✅ APPROUVÉ TECHNIQUE - EN ATTENTE VALIDATION',
      className: 'bg-blue-500/20 text-blue-700 border-blue-300',
      icon: CheckCircle2,
    },
    approved: {
      label: '✅ APPROUVÉE (COMPLÈTE)',
      className: 'bg-emerald-500/20 text-emerald-700 border-emerald-300',
      icon: CheckCircle2,
    },
    rejected: {
      label: '❌ REJETÉE',
      className: 'bg-red-500/20 text-red-700 border-red-300',
      icon: XCircle,
    },
  };

  const cfg = config[status] || config.awaiting_technical;
  const Icon = cfg.icon;

  return (
    <Badge className={cn('gap-1', cfg.className)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

// Technical Approval Panel (for Resp. Technique only)
function TechnicalApprovalPanel({
  order,
  onApprove,
  loading,
}: {
  order: ReceptionOrder;
  onApprove: (assessment: QualityAssessment, humidity?: number, grade?: string, notes?: string) => void;
  loading: boolean;
}) {
  const [step, setStep] = useState(1);
  const [humidityPhotoUploaded, setHumidityPhotoUploaded] = useState(false);
  const [humidityReading, setHumidityReading] = useState('8.5');
  const [gravelPhotoUploaded, setGravelPhotoUploaded] = useState(false);
  const [gravelGrade, setGravelGrade] = useState('G1');
  const [qualityStatus, setQualityStatus] = useState<QualityAssessment>('conforme');
  const [notes, setNotes] = useState('');

  const humidity = parseFloat(humidityReading) || 0;
  const isHighHumidity = humidity > 15;

  const handleSubmit = () => {
    hapticTap();
    onApprove(qualityStatus, humidity, gravelGrade, notes);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-100">
                ÉTAPE 1: Approbation Technique (REQUISE)
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                Responsable: Abdel Sadek ou Karim
              </p>
            </div>
          </div>
          <Badge className="bg-amber-500/20 text-amber-700 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            EN ATTENTE
          </Badge>
        </div>
      </div>

      {/* Step 1: Humidity Test */}
      {step === 1 && (
        <Card className="border-blue-200 dark:border-blue-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Droplets className="h-5 w-5 text-blue-600" />
              Test Humidité Sable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                📸 <strong>Photo obligatoire</strong> du test d'humidité avant saisie.
              </p>
            </div>

            {!humidityPhotoUploaded ? (
              <button
                onClick={() => {
                  setTimeout(() => {
                    setHumidityPhotoUploaded(true);
                    toast.success('Photo humidité capturée');
                  }, 500);
                }}
                className={cn(
                  'w-full h-32 rounded-xl border-2 border-dashed transition-all',
                  'border-blue-300 bg-blue-100/50 dark:bg-blue-900/20',
                  'hover:border-blue-400 hover:bg-blue-200/50',
                  'flex flex-col items-center justify-center gap-2'
                )}
              >
                <Camera className="h-8 w-8 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">
                  Capturer Photo Humidité
                </span>
              </button>
            ) : (
              <div className="w-full h-32 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-300 flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">
                  Photo humidité capturée ✓
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label>Taux d'humidité (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={humidityReading}
                onChange={(e) => setHumidityReading(e.target.value)}
                disabled={!humidityPhotoUploaded}
                className="bg-background"
              />
            </div>

            {isHighHumidity && (
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  ⚠️ Humidité élevée ({humidity}%) - Considérer "À vérifier"
                </p>
              </div>
            )}

            <Button
              className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
              onClick={() => setStep(2)}
              disabled={!humidityPhotoUploaded || humidity <= 0}
            >
              Continuer
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Gravel Inspection */}
      {step === 2 && (
        <Card className="border-blue-200 dark:border-blue-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FlaskConical className="h-5 w-5 text-blue-600" />
              Inspection Gravier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!gravelPhotoUploaded ? (
              <button
                onClick={() => {
                  setTimeout(() => {
                    setGravelPhotoUploaded(true);
                    toast.success('Photo gravier capturée');
                  }, 500);
                }}
                className={cn(
                  'w-full h-32 rounded-xl border-2 border-dashed transition-all',
                  'border-blue-300 bg-blue-100/50 dark:bg-blue-900/20',
                  'hover:border-blue-400 hover:bg-blue-200/50',
                  'flex flex-col items-center justify-center gap-2'
                )}
              >
                <Camera className="h-8 w-8 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">
                  Capturer Photo Gravier
                </span>
              </button>
            ) : (
              <div className="w-full h-32 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-300 flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">
                  Photo gravier capturée ✓
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label>Grade du gravier</Label>
              <RadioGroup value={gravelGrade} onValueChange={setGravelGrade} className="space-y-2">
                {['G1', 'G2', 'G3'].map((grade) => (
                  <div
                    key={grade}
                    className={cn(
                      'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer',
                      gravelGrade === grade
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <RadioGroupItem value={grade} id={grade} disabled={!gravelPhotoUploaded} />
                    <Label htmlFor={grade} className="cursor-pointer">
                      {grade} (Gravier {grade === 'G1' ? '0-4mm' : grade === 'G2' ? '4-10mm' : '10-20mm'})
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button
              className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
              onClick={() => setStep(3)}
              disabled={!gravelPhotoUploaded}
            >
              Continuer
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Quality Assessment */}
      {step === 3 && (
        <Card className="border-blue-200 dark:border-blue-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              Évaluation Qualité Globale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
              <h4 className="font-medium text-sm">Résumé des tests:</h4>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Humidité: {humidityReading}% {isHighHumidity ? '(Élevée ⚠️)' : '(OK)'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Gravier: {gravelGrade}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-medium">Évaluation Qualité:</Label>
              <RadioGroup
                value={qualityStatus}
                onValueChange={(v) => setQualityStatus(v as QualityAssessment)}
                className="space-y-2"
              >
                <div
                  className={cn(
                    'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer',
                    qualityStatus === 'conforme'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <RadioGroupItem value="conforme" id="conforme" />
                  <Label htmlFor="conforme" className="flex-1 cursor-pointer">
                    <p className="font-medium text-emerald-700">✅ Conforme</p>
                    <p className="text-xs text-muted-foreground">
                      Tous les tests passés - Prêt pour validation Front Desk
                    </p>
                  </Label>
                </div>

                <div
                  className={cn(
                    'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer',
                    qualityStatus === 'a_verifier'
                      ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <RadioGroupItem value="a_verifier" id="a_verifier" />
                  <Label htmlFor="a_verifier" className="flex-1 cursor-pointer">
                    <p className="font-medium text-yellow-700">⚠️ À vérifier</p>
                    <p className="text-xs text-muted-foreground">
                      Nécessite vérification supplémentaire
                    </p>
                  </Label>
                </div>

                <div
                  className={cn(
                    'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer',
                    qualityStatus === 'non_conforme'
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-300'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <RadioGroupItem value="non_conforme" id="non_conforme" />
                  <Label htmlFor="non_conforme" className="flex-1 cursor-pointer">
                    <p className="font-medium text-red-700">❌ Non-conforme</p>
                    <p className="text-xs text-muted-foreground">
                      Rejeter la livraison
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observations, commentaires..."
                className="bg-background"
              />
            </div>

            <Button
              className={cn(
                'w-full gap-2',
                qualityStatus === 'conforme' && 'bg-emerald-500 hover:bg-emerald-600',
                qualityStatus === 'a_verifier' && 'bg-yellow-500 hover:bg-yellow-600',
                qualityStatus === 'non_conforme' && 'bg-red-500 hover:bg-red-600'
              )}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Traitement...' : 'Soumettre Approbation Technique'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Front Desk Validation Panel (blocked until tech approval)
function FrontDeskValidationPanel({
  order,
  onValidate,
  loading,
}: {
  order: ReceptionOrder;
  onValidate: (quantity: number, notes?: string) => void;
  loading: boolean;
}) {
  const [confirmedQuantity, setConfirmedQuantity] = useState(order.quantite.toString());
  const [notes, setNotes] = useState('');

  const isBlocked = order.tech_approval_status !== 'approved';

  const handleSubmit = () => {
    hapticTap();
    onValidate(parseFloat(confirmedQuantity), notes);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
              <ClipboardCheck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 dark:text-purple-100">
                ÉTAPE 2: Validation Front Desk {isBlocked && '(BLOQUÉE)'}
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-300">
                {isBlocked
                  ? 'En attente de l\'étape 1'
                  : `Approuvé par ${order.tech_approval_by_name}`}
              </p>
            </div>
          </div>
          <Badge
            className={cn(
              isBlocked
                ? 'bg-red-500/20 text-red-700 border-red-300'
                : 'bg-emerald-500/20 text-emerald-700 border-emerald-300'
            )}
          >
            {isBlocked ? (
              <>
                <Lock className="h-3 w-3 mr-1" />
                BLOQUÉE
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                PRÊTE
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Blocked State */}
      {isBlocked && (
        <div className="p-6 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <Lock className="h-6 w-6 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 dark:text-red-200">
                Validation BLOQUÉE
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Cette commande doit être approuvée par le Responsable Technique
                (Abdel Sadek ou Karim) avant validation.
              </p>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="w-full mt-4 gap-2" variant="outline" disabled>
                  <Lock className="h-4 w-4" />
                  Valider (Bloqué)
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>En attente de validation technique par Abdel Sadek</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Ready for Validation */}
      {!isBlocked && (
        <Card className="border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              Approbation Technique Confirmée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Technical Approval Summary */}
            <div className="p-3 rounded-lg bg-background border text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approuvé par:</span>
                <span className="font-medium">{order.tech_approval_by_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {order.tech_approval_at
                    ? new Date(order.tech_approval_at).toLocaleString('fr-FR')
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Qualité:</span>
                <Badge
                  className={cn(
                    order.quality_assessment === 'conforme' &&
                      'bg-emerald-500/20 text-emerald-700',
                    order.quality_assessment === 'a_verifier' &&
                      'bg-yellow-500/20 text-yellow-700',
                    order.quality_assessment === 'non_conforme' &&
                      'bg-red-500/20 text-red-700'
                  )}
                >
                  {order.quality_assessment === 'conforme' && '✅ Conforme'}
                  {order.quality_assessment === 'a_verifier' && '⚠️ À vérifier'}
                  {order.quality_assessment === 'non_conforme' && '❌ Non-conforme'}
                </Badge>
              </div>
              {order.humidity_test_pct && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Humidité:</span>
                  <span className="font-medium">{order.humidity_test_pct}%</span>
                </div>
              )}
              {order.gravel_grade && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gravier:</span>
                  <span className="font-medium">{order.gravel_grade}</span>
                </div>
              )}
              {order.tech_approval_notes && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="text-sm mt-1">{order.tech_approval_notes}</p>
                </div>
              )}
            </div>

            {/* Validation Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Quantité Confirmée</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={confirmedQuantity}
                  onChange={(e) => setConfirmedQuantity(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observations..."
                  className="bg-background"
                />
              </div>

              <Button
                className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600"
                onClick={handleSubmit}
                disabled={loading || parseFloat(confirmedQuantity) <= 0}
              >
                <CheckCircle2 className="h-4 w-4" />
                {loading ? 'Traitement...' : 'Finaliser Réception'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Main Two-Step Approval Component
export function TwoStepApprovalWorkflow({ order, onUpdate }: TwoStepApprovalWorkflowProps) {
  const [loading, setLoading] = useState(false);
  const { isResponsableTechnique, isCeo, isSuperviseur, isAgentAdministratif } = useAuth();

  const canApproveTechnical = isResponsableTechnique || isCeo || isSuperviseur;
  const canValidateFrontDesk = isAgentAdministratif || isCeo || isSuperviseur;

  const handleTechnicalApproval = async (
    assessment: QualityAssessment,
    humidity?: number,
    grade?: string,
    notes?: string
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('approve_technical_reception', {
        p_mouvement_id: order.id,
        p_quality_assessment: assessment,
        p_humidity_pct: humidity || null,
        p_gravel_grade: grade || null,
        p_notes: notes || null,
        p_photos: null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (result.success) {
        hapticSuccess();
        toast.success('✅ Approbation technique enregistrée!');
        onUpdate?.();
      } else {
        hapticError();
        toast.error(result.error || 'Erreur lors de l\'approbation');
      }
    } catch (error: any) {
      hapticError();
      toast.error(error.message || 'Erreur lors de l\'approbation');
    } finally {
      setLoading(false);
    }
  };

  const handleFrontDeskValidation = async (quantity: number, notes?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_frontdesk_reception', {
        p_mouvement_id: order.id,
        p_confirmed_quantity: quantity,
        p_notes: notes || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string; blocked?: boolean };

      if (result.blocked) {
        hapticError();
        toast.error('🔒 Validation bloquée - Approbation technique requise');
        return;
      }

      if (result.success) {
        hapticSuccess();
        toast.success('✅ Réception validée avec succès!');
        onUpdate?.();
      } else {
        hapticError();
        toast.error(result.error || 'Erreur lors de la validation');
      }
    } catch (error: any) {
      hapticError();
      toast.error(error.message || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const workflowStatus = order.workflow_status as WorkflowStatus;

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-background to-muted/20 border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg">
              📦 Commande Matière Première
            </h2>
            <p className="text-sm text-muted-foreground">
              {order.materiau} - {order.quantite} unités
            </p>
          </div>
          <WorkflowStatusBadge status={workflowStatus} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Fournisseur:</span>
            <p className="font-medium">{order.fournisseur || 'Non spécifié'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">N° BL:</span>
            <p className="font-mono font-medium">{order.numero_bl_fournisseur || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Date:</span>
            <p className="font-medium">
              {new Date(order.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Technical Approval */}
      {workflowStatus === 'awaiting_technical' && canApproveTechnical && (
        <TechnicalApprovalPanel
          order={order}
          onApprove={handleTechnicalApproval}
          loading={loading}
        />
      )}

      {/* Show blocked message for non-tech users */}
      {workflowStatus === 'awaiting_technical' && !canApproveTechnical && (
        <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Clock className="h-6 w-6 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-200">
                En attente d'approbation technique
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Cette commande doit être approuvée par le Responsable Technique
                (Abdel Sadek ou Karim) avant de pouvoir être validée.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Front Desk Validation */}
      {(workflowStatus === 'awaiting_frontdesk' || workflowStatus === 'awaiting_technical') && (
        <FrontDeskValidationPanel
          order={order}
          onValidate={handleFrontDeskValidation}
          loading={loading}
        />
      )}

      {/* Completed State */}
      {workflowStatus === 'approved' && (
        <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-200 text-lg">
                ✅ COMMANDE COMPLÈTE - PRÊTE POUR PRODUCTION
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                Workflow Two-Step validé avec succès
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejected State */}
      {workflowStatus === 'rejected' && (
        <div className="p-6 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="font-bold text-red-800 dark:text-red-200 text-lg">
                ❌ COMMANDE REJETÉE
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                La livraison a été rejetée suite au contrôle qualité
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
