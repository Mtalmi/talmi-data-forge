import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ClipboardCheck, 
  Truck, 
  Coins, 
  Cylinder, 
  FileText, 
  Send, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calculator,
  Shield,
  Lock,
  FileCheck,
  XCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SiloCheck {
  silo_id: string;
  materiau: string;
  niveau_app: number;
  niveau_physique: number;
  variance: number;
  variance_pct: number;
}

interface DocumentCheck {
  bl_id: string;
  statut_document: 'present' | 'manquant';
  signature_conforme: boolean;
}

interface TruckCheck {
  id_camion: string;
  chauffeur: string;
  km_app: number;
  km_reel: number;
  variance: number;
  anomaly: boolean;
}

export default function AuditExterne() {
  const { user, isCeo, isAuditeur } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Section A: Silo Checks
  const [siloChecks, setSiloChecks] = useState<SiloCheck[]>([]);
  const [selectedSilo, setSelectedSilo] = useState<string>('');
  
  // Section B: Cash Audit
  const [cashAppAmount, setCashAppAmount] = useState(0);
  const [cashPhysicalAmount, setCashPhysicalAmount] = useState(0);
  const [cashComment, setCashComment] = useState('');
  
  // Section C: Document Checks
  const [documentChecks, setDocumentChecks] = useState<DocumentCheck[]>([]);
  
  // Section D: Truck Checks
  const [truckChecks, setTruckChecks] = useState<TruckCheck[]>([]);
  
  // General
  const [auditorNotes, setAuditorNotes] = useState('');
  const [availableStocks, setAvailableStocks] = useState<{ materiau: string; quantite_actuelle: number }[]>([]);
  
  // Calculated values
  const cashVariance = cashAppAmount - cashPhysicalAmount;
  const cashVariancePct = cashAppAmount > 0 ? (cashVariance / cashAppAmount) * 100 : 0;
  const requiresCashComment = Math.abs(cashVariance) > 0 && !cashComment.trim();
  
  const currentPeriod = () => {
    const now = new Date();
    const day = now.getDate();
    const month = format(now, 'yyyy-MM');
    return day <= 15 ? `${month}-Q1` : `${month}-Q2`;
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      // Fetch stocks for silo selection
      const { data: stockData } = await supabase
        .from('stocks')
        .select('materiau, quantite_actuelle')
        .order('materiau');
      
      if (stockData) {
        setAvailableStocks(stockData);
        // Initialize silo checks with all materials
        setSiloChecks(stockData.map(s => ({
          silo_id: s.materiau,
          materiau: s.materiau,
          niveau_app: s.quantite_actuelle || 0,
          niveau_physique: 0,
          variance: 0,
          variance_pct: 0,
        })));
      }

      // Fetch 5 random BLs from last 15 days
      const fifteenDaysAgo = format(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const { data: blData } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id')
        .gte('date_livraison', fifteenDaysAgo)
        .in('workflow_status', ['livre', 'facture'])
        .limit(50);
      
      if (blData && blData.length > 0) {
        const shuffled = [...blData].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5);
        setDocumentChecks(selected.map(bl => ({
          bl_id: bl.bl_id,
          statut_document: 'present',
          signature_conforme: true,
        })));
      }

      // Fetch 2 random trucks
      const { data: truckData } = await supabase
        .from('flotte')
        .select('id_camion, chauffeur, km_compteur')
        .limit(20);
      
      if (truckData && truckData.length > 0) {
        const shuffled = [...truckData].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);
        setTruckChecks(selected.map(t => ({
          id_camion: t.id_camion,
          chauffeur: t.chauffeur || 'N/A',
          km_app: t.km_compteur || 0,
          km_reel: 0,
          variance: 0,
          anomaly: false,
        })));
      }

      // Fetch current cash from Journal de Caisse (approximation from paid invoices)
      const { data: cashData } = await supabase
        .from('factures')
        .select('total_ttc')
        .eq('statut', 'payee')
        .gte('date_facture', format(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
      
      if (cashData) {
        const totalCash = cashData.reduce((sum, f) => sum + (f.total_ttc || 0), 0);
        setCashAppAmount(totalCash);
      }

    } catch (error) {
      console.error('Error fetching audit data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const updateSiloPhysical = (materiau: string, physicalValue: number) => {
    setSiloChecks(prev => prev.map(s => {
      if (s.materiau === materiau) {
        const variance = physicalValue - s.niveau_app;
        const variance_pct = s.niveau_app > 0 ? (variance / s.niveau_app) * 100 : 0;
        return { ...s, niveau_physique: physicalValue, variance, variance_pct };
      }
      return s;
    }));
  };

  const updateTruckKm = (index: number, kmReel: number) => {
    setTruckChecks(prev => prev.map((t, i) => {
      if (i === index) {
        const variance = kmReel - t.km_app;
        // Anomaly if physical km is LESS than app km (odometer tampering)
        const anomaly = kmReel < t.km_app;
        return { ...t, km_reel: kmReel, variance, anomaly };
      }
      return t;
    }));
  };

  const updateDocumentStatus = (index: number, field: 'statut_document' | 'signature_conforme', value: any) => {
    setDocumentChecks(prev => prev.map((d, i) => {
      if (i === index) {
        return { ...d, [field]: value };
      }
      return d;
    }));
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    // Validation
    if (requiresCashComment) {
      toast.error('Un commentaire est requis quand l\'écart de caisse n\'est pas zéro');
      return;
    }

    const missingPhysicalSilo = siloChecks.some(s => s.niveau_physique === 0);
    if (missingPhysicalSilo) {
      toast.error('Veuillez saisir le niveau physique pour tous les silos');
      return;
    }

    const missingTruckKm = truckChecks.some(t => t.km_reel === 0);
    if (missingTruckKm) {
      toast.error('Veuillez saisir le kilométrage réel pour tous les camions');
      return;
    }
    
    setSubmitting(true);
    try {
      const verifiedCount = documentChecks.filter(d => d.statut_document === 'present').length;
      const missingCount = documentChecks.filter(d => d.statut_document === 'manquant').length;
      const truckAnomalyDetected = truckChecks.some(t => t.anomaly);
      const maxSiloVariance = Math.max(...siloChecks.map(s => Math.abs(s.variance_pct)));

      // Insert the audit record - cast JSONB fields
      const { data: auditData, error: insertError } = await supabase
        .from('audits_externes')
        .insert([{
          audit_period: currentPeriod(),
          silo_checks: JSON.parse(JSON.stringify(siloChecks)),
          silo_variance_max_pct: maxSiloVariance,
          cash_app_amount: cashAppAmount,
          cash_physical_amount: cashPhysicalAmount,
          cash_comment: cashComment,
          document_checks: JSON.parse(JSON.stringify(documentChecks)),
          documents_verified_count: verifiedCount,
          documents_missing_count: missingCount,
          truck_checks: JSON.parse(JSON.stringify(truckChecks)),
          truck_anomaly_detected: truckAnomalyDetected,
          auditor_id: user.id,
          auditor_notes: auditorNotes,
          status: 'submitted',
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Call edge function to generate PDF and send email
      const { error: emailError } = await supabase.functions.invoke('send-audit-report', {
        body: {
          auditId: auditData.id,
          auditPeriod: currentPeriod(),
          siloChecks,
          maxSiloVariance,
          cashAppAmount,
          cashPhysicalAmount,
          cashVariance,
          cashVariancePct: cashVariancePct.toFixed(2),
          cashComment,
          documentChecks,
          verifiedCount,
          missingCount,
          truckChecks,
          truckAnomalyDetected,
          auditorNotes,
          complianceScore: auditData.compliance_score,
          submittedAt: new Date().toISOString(),
        },
      });

      if (emailError) {
        console.error('Email error:', emailError);
        toast.warning('Audit soumis mais erreur d\'envoi email');
      } else {
        await supabase
          .from('audits_externes')
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq('id', auditData.id);
      }

      toast.success('Audit soumis avec succès! Rapport envoyé au CEO.');
      
      // Reset form
      fetchAuditData();
      setAuditorNotes('');
      setCashPhysicalAmount(0);
      setCashComment('');

    } catch (error) {
      console.error('Error submitting audit:', error);
      toast.error('Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const getVarianceBadge = (pct: number) => {
    const absPct = Math.abs(pct);
    if (absPct <= 2) {
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-mono">✓ {pct.toFixed(1)}%</Badge>;
    } else if (absPct <= 5) {
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 font-mono">⚠ {pct.toFixed(1)}%</Badge>;
    } else {
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/30 font-mono">✗ {pct.toFixed(1)}%</Badge>;
    }
  };

  if (!isCeo && !isAuditeur) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md border-2 border-destructive/20">
            <CardContent className="pt-6 text-center">
              <Shield className="h-16 w-16 text-destructive/50 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Accès Restreint</h2>
              <p className="text-muted-foreground">
                Ce portail est exclusivement réservé aux auditeurs externes accrédités.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Professional Header with Glassmorphism */}
        <div className="glass-premium p-6 shadow-lg">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <ClipboardCheck className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Portail Audit Externe</h1>
                <p className="text-muted-foreground text-sm">
                  Audit Bi-Mensuel • Période: <span className="font-mono font-semibold text-primary">{currentPeriod()}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-warning/30 text-warning bg-warning/10">
                <Lock className="h-3 w-3 mr-1" />
                Immutable après soumission
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchAuditData} 
                disabled={loading}
                className="glass-card min-h-[44px]"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Rafraîchir
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground font-medium">Chargement des données d'audit...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section A: Silo Reconciliation */}
            <Card className="border-2 border-blue-500/20">
              <CardHeader className="bg-blue-500/5 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Cylinder className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Section A: Réconciliation des Stocks (Silos)</CardTitle>
                    <CardDescription>Comparez les niveaux système vs mesures physiques</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {siloChecks.map((silo) => (
                    <div 
                      key={silo.materiau} 
                      className={cn(
                        "grid grid-cols-5 gap-4 items-center p-4 rounded-lg border-2 transition-colors",
                        Math.abs(silo.variance_pct) > 5 
                          ? "border-red-500/50 bg-red-500/5" 
                          : "border-border bg-muted/30"
                      )}
                    >
                      <div>
                        <Label className="text-xs text-muted-foreground">Silo</Label>
                        <p className="font-semibold">{silo.materiau}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Niveau App</Label>
                        <p className="font-mono text-lg">{silo.niveau_app.toFixed(1)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Niveau Physique *</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={silo.niveau_physique || ''}
                          onChange={(e) => updateSiloPhysical(silo.materiau, parseFloat(e.target.value) || 0)}
                          placeholder="Mesure réelle"
                          className="font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Écart</Label>
                        <p className={cn(
                          "font-mono text-lg font-semibold",
                          Math.abs(silo.variance_pct) > 5 ? "text-red-600" : "text-emerald-600"
                        )}>
                          {silo.variance >= 0 ? '+' : ''}{silo.variance.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-right">
                        {silo.niveau_physique > 0 && getVarianceBadge(silo.variance_pct)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Section B: Cash Audit */}
            <Card className="border-2 border-emerald-500/20">
              <CardHeader className="bg-emerald-500/5 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Coins className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Section B: Audit de Caisse</CardTitle>
                    <CardDescription>Vérification du solde Journal de Caisse vs comptage physique</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Solde Caisse App (DH)</Label>
                    <div className="p-4 bg-muted rounded-lg border">
                      <p className="font-mono text-2xl font-semibold">{cashAppAmount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Lecture seule - Système</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Comptage Physique (DH) *</Label>
                    <Input
                      type="number"
                      value={cashPhysicalAmount || ''}
                      onChange={(e) => setCashPhysicalAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Montant compté"
                      className="font-mono text-lg h-14"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Écart Caisse</Label>
                    <div className={cn(
                      "p-4 rounded-lg border-2",
                      Math.abs(cashVariancePct) > 5 
                        ? "bg-red-500/10 border-red-500/50" 
                        : cashVariance === 0 
                          ? "bg-emerald-500/10 border-emerald-500/50"
                          : "bg-amber-500/10 border-amber-500/50"
                    )}>
                      <p className={cn(
                        "font-mono text-2xl font-semibold",
                        cashVariance === 0 ? "text-emerald-600" : 
                        Math.abs(cashVariancePct) > 5 ? "text-red-600" : "text-amber-600"
                      )}>
                        {cashVariance >= 0 ? '+' : ''}{cashVariance.toLocaleString()} DH
                      </p>
                      <p className="text-xs mt-1">{cashVariancePct.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
                
                {Math.abs(cashVariance) > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className={cn(
                      "text-sm font-medium",
                      requiresCashComment && "text-red-600"
                    )}>
                      Commentaire obligatoire (écart ≠ 0) *
                    </Label>
                    <Textarea
                      value={cashComment}
                      onChange={(e) => setCashComment(e.target.value)}
                      placeholder="Expliquez l'écart constaté..."
                      className={cn(requiresCashComment && "border-red-500")}
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section C: Document Spot-Check */}
            <Card className="border-2 border-amber-500/20">
              <CardHeader className="bg-amber-500/5 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Section C: Contrôle Documentaire (Spot-Check)</CardTitle>
                    <CardDescription>5 BL sélectionnés aléatoirement des 15 derniers jours</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
                    <span>Référence BL</span>
                    <span>Statut Document</span>
                    <span>Signature Conforme</span>
                    <span className="text-right">Verdict</span>
                  </div>
                  {documentChecks.map((doc, index) => (
                    <div 
                      key={doc.bl_id}
                      className={cn(
                        "grid grid-cols-4 gap-4 items-center p-4 rounded-lg border-2 transition-all",
                        doc.statut_document === 'present' && doc.signature_conforme
                          ? "border-emerald-500/30 bg-emerald-500/5" 
                          : "border-red-500/30 bg-red-500/5"
                      )}
                    >
                      <div className="font-mono font-semibold">{doc.bl_id}</div>
                      <div>
                        <Select
                          value={doc.statut_document}
                          onValueChange={(v) => updateDocumentStatus(index, 'statut_document', v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">
                              <span className="flex items-center gap-2">
                                <FileCheck className="h-4 w-4 text-emerald-600" />
                                Présent
                              </span>
                            </SelectItem>
                            <SelectItem value="manquant">
                              <span className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                Manquant
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={doc.signature_conforme}
                          onCheckedChange={(v) => updateDocumentStatus(index, 'signature_conforme', v)}
                        />
                        <span className="text-sm">
                          {doc.signature_conforme ? 'Oui' : 'Non'}
                        </span>
                      </div>
                      <div className="text-right">
                        {doc.statut_document === 'present' && doc.signature_conforme ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Conforme
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Non-conforme
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-6 text-sm font-medium">
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {documentChecks.filter(d => d.statut_document === 'present' && d.signature_conforme).length} conformes
                  </span>
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    {documentChecks.filter(d => d.statut_document === 'manquant' || !d.signature_conforme).length} non-conformes
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Section D: Truck Odometer Check */}
            <Card className="border-2 border-violet-500/20">
              <CardHeader className="bg-violet-500/5 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/10 rounded-lg">
                    <Truck className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Section D: Audit Logistique (Compteurs)</CardTitle>
                    <CardDescription>2 camions sélectionnés aléatoirement - Vérification odomètre</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {truckChecks.map((truck, index) => (
                    <div 
                      key={truck.id_camion}
                      className={cn(
                        "grid grid-cols-5 gap-4 items-center p-4 rounded-lg border-2 transition-colors",
                        truck.anomaly 
                          ? "border-red-500/50 bg-red-500/5" 
                          : "border-border bg-muted/30"
                      )}
                    >
                      <div>
                        <Label className="text-xs text-muted-foreground">Camion</Label>
                        <p className="font-semibold">{truck.id_camion}</p>
                        <p className="text-xs text-muted-foreground">{truck.chauffeur}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">KM App</Label>
                        <p className="font-mono text-lg">{truck.km_app.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">KM Réel (Odomètre) *</Label>
                        <Input
                          type="number"
                          value={truck.km_reel || ''}
                          onChange={(e) => updateTruckKm(index, parseFloat(e.target.value) || 0)}
                          placeholder="Relevé compteur"
                          className="font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Écart</Label>
                        <p className={cn(
                          "font-mono text-lg font-semibold",
                          truck.anomaly ? "text-red-600" : "text-emerald-600"
                        )}>
                          {truck.variance >= 0 ? '+' : ''}{truck.variance.toLocaleString()} km
                        </p>
                      </div>
                      <div className="text-right">
                        {truck.km_reel > 0 && (
                          truck.anomaly ? (
                            <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              ANOMALIE
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {truckChecks.some(t => t.anomaly) && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-700 font-medium flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      ALERTE: Anomalie détectée - KM réel inférieur au KM système (manipulation possible)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auditor Notes & Submit */}
            <Card className="border-2">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Notes de l'Auditeur</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <Textarea
                  value={auditorNotes}
                  onChange={(e) => setAuditorNotes(e.target.value)}
                  placeholder="Observations générales, recommandations, points d'attention..."
                  rows={4}
                />
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Une fois soumis, cet audit sera verrouillé et ne pourra plus être modifié.
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting || requiresCashComment}
                    className="min-w-[200px] min-h-[52px] h-14 text-base font-semibold"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Soumettre l'Audit
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}