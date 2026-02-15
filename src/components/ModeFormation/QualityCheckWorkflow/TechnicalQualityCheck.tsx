// Technical Quality Check - Step 1 (Abdel Sadek / Karim)
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Droplets,
  FlaskConical,
  Camera,
  Upload,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Shield,
  User,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';
import {
  QualityCheckData,
  QualityStatus,
  StockReceptionOrder,
  DEMO_USERS,
} from './types';

interface TechnicalQualityCheckProps {
  order: StockReceptionOrder;
  onComplete: (data: QualityCheckData) => void;
}

const GRAVEL_GRADES = [
  { id: 'G1', name: 'G1 (Gravier 0-4mm)' },
  { id: 'G2', name: 'G2 (Gravier 4-10mm)' },
  { id: 'G3', name: 'G3 (Gravier 10-20mm)' },
];

export function TechnicalQualityCheck({ order, onComplete }: TechnicalQualityCheckProps) {
  const { t } = useI18n();
  const tq = t.technicalQuality;
  const [step, setStep] = useState(1);
  const [selectedTechnician, setSelectedTechnician] = useState<'ABDEL_SADEK' | 'KARIM'>('ABDEL_SADEK');
  
  const [humidityPhotoUploaded, setHumidityPhotoUploaded] = useState(false);
  const [humidityReading, setHumidityReading] = useState('8.5');
  const [gravelPhotoUploaded, setGravelPhotoUploaded] = useState(false);
  const [gravelGrade, setGravelGrade] = useState('G1');
  const [qualityStatus, setQualityStatus] = useState<QualityStatus>('conforme');
  const [notes, setNotes] = useState('');

  const humidity = parseFloat(humidityReading) || 0;
  const isHighHumidity = humidity > 15;
  const technician = DEMO_USERS[selectedTechnician];

  const handleHumidityPhotoUpload = () => {
    setTimeout(() => {
      setHumidityPhotoUploaded(true);
      toast.success(tq.simHumidityPhoto);
    }, 500);
  };

  const handleGravelPhotoUpload = () => {
    setTimeout(() => {
      setGravelPhotoUploaded(true);
      toast.success(tq.simGravelPhoto);
    }, 500);
  };

  const handleSubmit = () => {
    const qualityCheckData: QualityCheckData = {
      humidity: {
        photoUploaded: humidityPhotoUploaded,
        reading: humidity,
        isHighHumidity,
      },
      gravel: {
        photoUploaded: gravelPhotoUploaded,
        grade: gravelGrade,
      },
      status: qualityStatus,
      notes,
      technician: technician.name,
      timestamp: new Date().toISOString(),
    };

    console.log('[QUALITY_CHECK]:', qualityCheckData);
    
    const statusLabel = qualityStatus === 'conforme' ? tq.statusConforme : qualityStatus === 'a_verifier' ? tq.statusAVerifier : tq.statusNonConforme;
    toast.success(tq.assessmentSubmitted, {
      description: `Status: ${statusLabel}`,
    });

    onComplete(qualityCheckData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with role badge */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-100">
                {tq.phase1Title}
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                {tq.phase1Subtitle}
              </p>
            </div>
          </div>
          <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300">
            <User className="h-3 w-3 mr-1" />
            {technician.name}
          </Badge>
        </div>
      </div>

      {/* Technician Selection */}
      {step === 1 && (
        <Card className="border-blue-200 dark:border-blue-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              {tq.step1Title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{tq.selectTechnician}</p>

            <RadioGroup
              value={selectedTechnician}
              onValueChange={(v) => setSelectedTechnician(v as 'ABDEL_SADEK' | 'KARIM')}
              className="space-y-2"
            >
              <div className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer",
                selectedTechnician === 'ABDEL_SADEK' 
                  ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300" 
                  : "hover:bg-muted/50"
              )}>
                <RadioGroupItem value="ABDEL_SADEK" id="abdel" />
                <Label htmlFor="abdel" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Abdel Sadek</p>
                      <p className="text-xs text-muted-foreground">{tq.primaryTech}</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300">
                      {tq.primary}
                    </Badge>
                  </div>
                </Label>
              </div>

              <div className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer",
                selectedTechnician === 'KARIM' 
                  ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300" 
                  : "hover:bg-muted/50"
              )}>
                <RadioGroupItem value="KARIM" id="karim" />
                <Label htmlFor="karim" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Karim</p>
                      <p className="text-xs text-muted-foreground">{tq.backupTech}</p>
                    </div>
                    <Badge variant="outline">{tq.backup}</Badge>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <div className="p-4 rounded-lg bg-muted/50 border mt-4">
              <h4 className="font-medium mb-2 text-sm">{tq.orderToInspect}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">{tq.orderNumber}</span>
                  <p className="font-mono font-bold text-amber-600">{order.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{tq.supplier}</span>
                  <p className="font-medium">{order.supplier}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{tq.material}</span>
                  <p className="font-medium">{order.material}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{tq.quantity}</span>
                  <p className="font-bold">{order.quantity} {order.unit}</p>
                </div>
              </div>
            </div>

            <Button
              className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
              onClick={() => setStep(2)}
            >
              {tq.startInspection}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Humidity Test */}
      {step === 2 && (
        <Card className="border-blue-200 dark:border-blue-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Droplets className="h-5 w-5 text-blue-600" />
              {tq.step2Title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                📸 <strong>{tq.humidityPhotoInstruction}</strong>
              </p>
            </div>

            {!humidityPhotoUploaded ? (
              <button
                onClick={handleHumidityPhotoUpload}
                className={cn(
                  "w-full h-36 rounded-xl border-2 border-dashed transition-all",
                  "border-blue-300 bg-blue-100/50 dark:bg-blue-900/20",
                  "hover:border-blue-400 hover:bg-blue-200/50",
                  "flex flex-col items-center justify-center gap-3"
                )}
              >
                <Upload className="h-10 w-10 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {tq.uploadHumidityPhoto}
                </span>
              </button>
            ) : (
              <div className="w-full h-36 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-300 flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {tq.humidityPhotoCaptured}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label>{tq.humidityRate}</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={humidityReading}
                onChange={(e) => setHumidityReading(e.target.value)}
                className="bg-background"
                placeholder="Ex: 8.5"
                disabled={!humidityPhotoUploaded}
              />
              <p className="text-xs text-muted-foreground">{tq.validRange}</p>
            </div>

            {isHighHumidity && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">
                  ⚠️ {tq.highHumidity.replace('{value}', String(humidity))}
                </p>
              </div>
            )}

            {humidityPhotoUploaded && humidity > 0 && humidity <= 15 && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {tq.acceptableHumidity.replace('{value}', String(humidity))}
                </p>
              </div>
            )}

            <Button
              className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
              onClick={() => setStep(3)}
              disabled={!humidityPhotoUploaded || humidity <= 0}
            >
              {tq.validateHumidity}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Gravel Inspection */}
      {step === 3 && (
        <Card className="border-blue-200 dark:border-blue-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FlaskConical className="h-5 w-5 text-blue-600" />
              {tq.step3Title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                📸 <strong>{tq.gravelPhotoInstruction}</strong>
              </p>
            </div>

            {!gravelPhotoUploaded ? (
              <button
                onClick={handleGravelPhotoUpload}
                className={cn(
                  "w-full h-36 rounded-xl border-2 border-dashed transition-all",
                  "border-blue-300 bg-blue-100/50 dark:bg-blue-900/20",
                  "hover:border-blue-400 hover:bg-blue-200/50",
                  "flex flex-col items-center justify-center gap-3"
                )}
              >
                <Camera className="h-10 w-10 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {tq.uploadGravelPhoto}
                </span>
              </button>
            ) : (
              <div className="w-full h-36 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-300 flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {tq.gravelPhotoCaptured}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label>{tq.gravelGrade}</Label>
              <Select value={gravelGrade} onValueChange={setGravelGrade} disabled={!gravelPhotoUploaded}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={tq.selectGrade} />
                </SelectTrigger>
                <SelectContent>
                  {GRAVEL_GRADES.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
              onClick={() => setStep(4)}
              disabled={!gravelPhotoUploaded}
            >
              {tq.validateInspection}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quality Assessment */}
      {step === 4 && (
        <Card className="border-blue-200 dark:border-blue-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              {tq.step4Title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
              <h4 className="font-medium text-sm">{tq.testSummary}</h4>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{tq.humidityLabel} {humidityReading}% {isHighHumidity ? tq.highLabel : tq.okLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{tq.gravelLabel} {gravelGrade}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-medium">{tq.qualityAssessment}</Label>
              <RadioGroup
                value={qualityStatus}
                onValueChange={(v) => setQualityStatus(v as QualityStatus)}
                className="space-y-2"
              >
                <div className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer",
                  qualityStatus === 'conforme' 
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300" 
                    : "hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="conforme" id="conforme" />
                  <Label htmlFor="conforme" className="flex-1 cursor-pointer">
                    <p className="font-medium text-emerald-700 dark:text-emerald-300">
                      {tq.compliant}
                    </p>
                    <p className="text-xs text-muted-foreground">{tq.compliantDesc}</p>
                  </Label>
                </div>

                <div className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer",
                  qualityStatus === 'a_verifier' 
                    ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300" 
                    : "hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="a_verifier" id="a_verifier" />
                  <Label htmlFor="a_verifier" className="flex-1 cursor-pointer">
                    <p className="font-medium text-yellow-700 dark:text-yellow-300">
                      {tq.needsVerification}
                    </p>
                    <p className="text-xs text-muted-foreground">{tq.needsVerificationDesc}</p>
                  </Label>
                </div>

                <div className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer",
                  qualityStatus === 'non_conforme' 
                    ? "bg-red-50 dark:bg-red-950/30 border-red-300" 
                    : "hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="non_conforme" id="non_conforme" />
                  <Label htmlFor="non_conforme" className="flex-1 cursor-pointer">
                    <p className="font-medium text-red-700 dark:text-red-300">
                      {tq.nonCompliant}
                    </p>
                    <p className="text-xs text-muted-foreground">{tq.nonCompliantDesc}</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>{tq.notesOptional}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={tq.notesPlaceholder}
                className="bg-background resize-none"
                rows={3}
              />
            </div>

            <Button
              className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
              onClick={handleSubmit}
            >
              <CheckCircle2 className="h-4 w-4" />
              {tq.submitAssessment}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {tq.autoTransmit}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
