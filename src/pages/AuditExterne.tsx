import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
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
import {
  ClipboardCheck, Truck, Coins, Cylinder, FileText, Send, AlertTriangle,
  CheckCircle, RefreshCw, Shield, Lock, FileCheck, XCircle, Loader2
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
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const e = t.pages.auditExterne;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [siloChecks, setSiloChecks] = useState<SiloCheck[]>([]);
  const [cashAppAmount, setCashAppAmount] = useState(0);
  const [cashPhysicalAmount, setCashPhysicalAmount] = useState(0);
  const [cashComment, setCashComment] = useState('');
  const [documentChecks, setDocumentChecks] = useState<DocumentCheck[]>([]);
  const [truckChecks, setTruckChecks] = useState<TruckCheck[]>([]);
  const [auditorNotes, setAuditorNotes] = useState('');
  const [availableStocks, setAvailableStocks] = useState<{ materiau: string; quantite_actuelle: number }[]>([]);

  const cashVariance = cashAppAmount - cashPhysicalAmount;
  const cashVariancePct = cashAppAmount > 0 ? (cashVariance / cashAppAmount) * 100 : 0;
  const requiresCashComment = Math.abs(cashVariance) > 0 && !cashComment.trim();

  const currentPeriod = () => {
    const now = new Date();
    const day = now.getDate();
    const month = format(now, 'yyyy-MM');
    return day <= 15 ? `${month}-Q1` : `${month}-Q2`;
  };

  useEffect(() => { fetchAuditData(); }, []);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const { data: stockData } = await supabase.from('stocks').select('materiau, quantite_actuelle').order('materiau');
      if (stockData) {
        setAvailableStocks(stockData);
        setSiloChecks(stockData.map(s => ({ silo_id: s.materiau, materiau: s.materiau, niveau_app: s.quantite_actuelle || 0, niveau_physique: 0, variance: 0, variance_pct: 0 })));
      }
      const fifteenDaysAgo = format(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const { data: blData } = await supabase.from('bons_livraison_reels').select('bl_id').gte('date_livraison', fifteenDaysAgo).in('workflow_status', ['livre', 'facture']).limit(50);
      if (blData && blData.length > 0) {
        const selected = [...blData].sort(() => 0.5 - Math.random()).slice(0, 5);
        setDocumentChecks(selected.map(bl => ({ bl_id: bl.bl_id, statut_document: 'present', signature_conforme: true })));
      }
      const { data: truckData } = await supabase.from('flotte').select('id_camion, chauffeur, km_compteur').limit(20);
      if (truckData && truckData.length > 0) {
        const selected = [...truckData].sort(() => 0.5 - Math.random()).slice(0, 2);
        setTruckChecks(selected.map(t => ({ id_camion: t.id_camion, chauffeur: t.chauffeur || 'N/A', km_app: t.km_compteur || 0, km_reel: 0, variance: 0, anomaly: false })));
      }
      const { data: cashData } = await supabase.from('factures').select('total_ttc').eq('statut', 'payee').gte('date_facture', fifteenDaysAgo);
      if (cashData) setCashAppAmount(cashData.reduce((sum, f) => sum + (f.total_ttc || 0), 0));
    } catch (error) {
      console.error(error);
      toast.error(t.common.error);
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
        return { ...t, km_reel: kmReel, variance, anomaly: kmReel < t.km_app };
      }
      return t;
    }));
  };

  const updateDocumentStatus = (index: number, field: 'statut_document' | 'signature_conforme', value: any) => {
    setDocumentChecks(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (requiresCashComment) { toast.error(e.cashCommentRequired); return; }
    if (siloChecks.some(s => s.niveau_physique === 0)) { toast.error(e.siloPhysicalRequired); return; }
    if (truckChecks.some(t => t.km_reel === 0)) { toast.error(e.truckKmRequired); return; }

    setSubmitting(true);
    try {
      const verifiedCount = documentChecks.filter(d => d.statut_document === 'present').length;
      const missingCount = documentChecks.filter(d => d.statut_document === 'manquant').length;
      const truckAnomalyDetected = truckChecks.some(t => t.anomaly);
      const maxSiloVariance = Math.max(...siloChecks.map(s => Math.abs(s.variance_pct)));

      const { data: auditData, error: insertError } = await supabase.from('audits_externes').insert([{
        audit_period: currentPeriod(), silo_checks: JSON.parse(JSON.stringify(siloChecks)), silo_variance_max_pct: maxSiloVariance,
        cash_app_amount: cashAppAmount, cash_physical_amount: cashPhysicalAmount, cash_comment: cashComment,
        document_checks: JSON.parse(JSON.stringify(documentChecks)), documents_verified_count: verifiedCount, documents_missing_count: missingCount,
        truck_checks: JSON.parse(JSON.stringify(truckChecks)), truck_anomaly_detected: truckAnomalyDetected,
        auditor_id: user.id, auditor_notes: auditorNotes, status: 'submitted',
      }]).select().single();

      if (insertError) throw insertError;

      const { error: emailError } = await supabase.functions.invoke('send-audit-report', {
        body: { auditId: auditData.id, auditPeriod: currentPeriod(), siloChecks, maxSiloVariance, cashAppAmount, cashPhysicalAmount, cashVariance, cashVariancePct: cashVariancePct.toFixed(2), cashComment, documentChecks, verifiedCount, missingCount, truckChecks, truckAnomalyDetected, auditorNotes, complianceScore: auditData.compliance_score, submittedAt: new Date().toISOString() },
      });

      if (emailError) { console.error(emailError); toast.warning(e.emailWarning); }
      else { await supabase.from('audits_externes').update({ email_sent: true, email_sent_at: new Date().toISOString() }).eq('id', auditData.id); }

      toast.success(e.submitSuccess);
      fetchAuditData(); setAuditorNotes(''); setCashPhysicalAmount(0); setCashComment('');
    } catch (error) {
      console.error(error);
      toast.error(e.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const getVarianceBadge = (pct: number) => {
    const absPct = Math.abs(pct);
    if (absPct <= 2) return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-mono">✓ {pct.toFixed(1)}%</Badge>;
    if (absPct <= 5) return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 font-mono">⚠ {pct.toFixed(1)}%</Badge>;
    return <Badge className="bg-red-500/10 text-red-600 border-red-500/30 font-mono">✗ {pct.toFixed(1)}%</Badge>;
  };

  if (!isCeo && !isAuditeur) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md border-2 border-destructive/20">
            <CardContent className="pt-6 text-center">
              <Shield className="h-16 w-16 text-destructive/50 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">{e.restrictedAccess}</h2>
              <p className="text-muted-foreground">{e.restrictedDesc}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="glass-premium p-6 shadow-lg">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20"><ClipboardCheck className="h-8 w-8 text-primary" /></div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{e.title}</h1>
                <p className="text-muted-foreground text-sm">{e.biMonthlyAudit} • {e.period}: <span className="font-mono font-semibold text-primary">{currentPeriod()}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-warning/30 text-warning bg-warning/10"><Lock className="h-3 w-3 mr-1" />{e.immutableAfterSubmit}</Badge>
              <Button variant="outline" size="sm" onClick={fetchAuditData} disabled={loading} className="glass-card min-h-[44px]">
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />{e.refresh}
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" /><p className="mt-4 text-muted-foreground font-medium">{e.loadingData}</p></div>
        ) : (
          <div className="space-y-6">
            {/* Section A: Silo */}
            <Card className="border-2 border-blue-500/20">
              <CardHeader className="bg-blue-500/5 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg"><Cylinder className="h-5 w-5 text-blue-600" /></div>
                  <div><CardTitle className="text-lg">{e.sectionSilo}</CardTitle><CardDescription>{e.sectionSiloDesc}</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {siloChecks.map((silo) => (
                    <div key={silo.materiau} className={cn("grid grid-cols-5 gap-4 items-center p-4 rounded-lg border-2 transition-colors", Math.abs(silo.variance_pct) > 5 ? "border-red-500/50 bg-red-500/5" : "border-border bg-muted/30")}>
                      <div><Label className="text-xs text-muted-foreground">{e.silo}</Label><p className="font-semibold">{silo.materiau}</p></div>
                      <div><Label className="text-xs text-muted-foreground">{e.appLevel}</Label><p className="font-mono text-lg">{silo.niveau_app.toFixed(1)}</p></div>
                      <div><Label className="text-xs text-muted-foreground">{e.physicalLevel} *</Label><Input type="number" step="0.1" value={silo.niveau_physique || ''} onChange={(ev) => updateSiloPhysical(silo.materiau, parseFloat(ev.target.value) || 0)} placeholder={e.actualMeasure} className="font-mono" /></div>
                      <div><Label className="text-xs text-muted-foreground">{e.variance}</Label><p className={cn("font-mono text-lg font-semibold", Math.abs(silo.variance_pct) > 5 ? "text-red-600" : "text-emerald-600")}>{silo.variance >= 0 ? '+' : ''}{silo.variance.toFixed(1)}</p></div>
                      <div className="text-right">{silo.niveau_physique > 0 && getVarianceBadge(silo.variance_pct)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Section B: Cash */}
            <Card className="border-2 border-emerald-500/20">
              <CardHeader className="bg-emerald-500/5 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg"><Coins className="h-5 w-5 text-emerald-600" /></div>
                  <div><CardTitle className="text-lg">{e.sectionCash}</CardTitle><CardDescription>{e.sectionCashDesc}</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2"><Label className="text-sm font-medium">{e.appBalance}</Label><div className="p-4 bg-muted rounded-lg border"><p className="font-mono text-2xl font-semibold">{cashAppAmount.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">{e.readOnlySystem}</p></div></div>
                  <div className="space-y-2"><Label className="text-sm font-medium">{e.physicalCount} *</Label><Input type="number" value={cashPhysicalAmount || ''} onChange={(ev) => setCashPhysicalAmount(parseFloat(ev.target.value) || 0)} placeholder={e.countedAmount} className="font-mono text-lg h-14" /></div>
                  <div className="space-y-2"><Label className="text-sm font-medium">{e.cashVariance}</Label><div className={cn("p-4 rounded-lg border-2", Math.abs(cashVariancePct) > 5 ? "bg-red-500/10 border-red-500/50" : cashVariance === 0 ? "bg-emerald-500/10 border-emerald-500/50" : "bg-amber-500/10 border-amber-500/50")}><p className={cn("font-mono text-2xl font-semibold", cashVariance === 0 ? "text-emerald-600" : Math.abs(cashVariancePct) > 5 ? "text-red-600" : "text-amber-600")}>{cashVariance >= 0 ? '+' : ''}{cashVariance.toLocaleString()} DH</p><p className="text-xs mt-1">{cashVariancePct.toFixed(2)}%</p></div></div>
                </div>
                {Math.abs(cashVariance) > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className={cn("text-sm font-medium", requiresCashComment && "text-red-600")}>{e.mandatoryComment} *</Label>
                    <Textarea value={cashComment} onChange={(ev) => setCashComment(ev.target.value)} placeholder={e.explainVariance} className={cn(requiresCashComment && "border-red-500")} rows={3} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section C: Documents */}
            <Card className="border-2 border-amber-500/20">
              <CardHeader className="bg-amber-500/5 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg"><FileText className="h-5 w-5 text-amber-600" /></div>
                  <div><CardTitle className="text-lg">{e.sectionDoc}</CardTitle><CardDescription>{e.sectionDocDesc}</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
                    <span>{e.blRef}</span><span>{e.docStatus}</span><span>{e.signatureCompliant}</span><span className="text-right">{e.verdict}</span>
                  </div>
                  {documentChecks.map((doc, index) => (
                    <div key={doc.bl_id} className={cn("grid grid-cols-4 gap-4 items-center p-4 rounded-lg border-2 transition-all", doc.statut_document === 'present' && doc.signature_conforme ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5")}>
                      <div className="font-mono font-semibold">{doc.bl_id}</div>
                      <div>
                        <Select value={doc.statut_document} onValueChange={(v) => updateDocumentStatus(index, 'statut_document', v)}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present"><span className="flex items-center gap-2"><FileCheck className="h-4 w-4 text-emerald-600" />{e.present}</span></SelectItem>
                            <SelectItem value="manquant"><span className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600" />{e.missing}</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={doc.signature_conforme} onCheckedChange={(v) => updateDocumentStatus(index, 'signature_conforme', v)} />
                        <span className="text-sm">{doc.signature_conforme ? t.common.yes : t.common.no}</span>
                      </div>
                      <div className="text-right">
                        {doc.statut_document === 'present' && doc.signature_conforme ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><CheckCircle className="h-3 w-3 mr-1" />{e.compliant}</Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-600 border-red-500/30"><AlertTriangle className="h-3 w-3 mr-1" />{e.nonCompliant}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-6 text-sm font-medium">
                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" />{documentChecks.filter(d => d.statut_document === 'present' && d.signature_conforme).length} {e.conformCount}</span>
                  <span className="text-red-600 flex items-center gap-1"><XCircle className="h-4 w-4" />{documentChecks.filter(d => d.statut_document === 'manquant' || !d.signature_conforme).length} {e.nonConformCount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Section D: Trucks */}
            <Card className="border-2 border-violet-500/20">
              <CardHeader className="bg-violet-500/5 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/10 rounded-lg"><Truck className="h-5 w-5 text-violet-600" /></div>
                  <div><CardTitle className="text-lg">{e.sectionTruck}</CardTitle><CardDescription>{e.sectionTruckDesc}</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {truckChecks.map((truck, index) => (
                    <div key={truck.id_camion} className={cn("grid grid-cols-5 gap-4 items-center p-4 rounded-lg border-2 transition-colors", truck.anomaly ? "border-red-500/50 bg-red-500/5" : "border-border bg-muted/30")}>
                      <div><Label className="text-xs text-muted-foreground">{e.truck}</Label><p className="font-semibold">{truck.id_camion}</p><p className="text-xs text-muted-foreground">{truck.chauffeur}</p></div>
                      <div><Label className="text-xs text-muted-foreground">{e.kmApp}</Label><p className="font-mono text-lg">{truck.km_app.toLocaleString()}</p></div>
                      <div><Label className="text-xs text-muted-foreground">{e.kmReal} *</Label><Input type="number" value={truck.km_reel || ''} onChange={(ev) => updateTruckKm(index, parseFloat(ev.target.value) || 0)} placeholder={e.odometerReading} className="font-mono" /></div>
                      <div><Label className="text-xs text-muted-foreground">{e.variance}</Label><p className={cn("font-mono text-lg font-semibold", truck.anomaly ? "text-red-600" : "text-emerald-600")}>{truck.variance >= 0 ? '+' : ''}{truck.variance.toLocaleString()} km</p></div>
                      <div className="text-right">
                        {truck.km_reel > 0 && (truck.anomaly ? (
                          <Badge className="bg-red-500/10 text-red-600 border-red-500/30"><AlertTriangle className="h-3 w-3 mr-1" />{e.anomaly}</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><CheckCircle className="h-3 w-3 mr-1" />OK</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {truckChecks.some(t => t.anomaly) && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-700 font-medium flex items-center gap-2"><AlertTriangle className="h-5 w-5" />{e.anomalyAlert}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes & Submit */}
            <Card className="border-2">
              <CardHeader className="border-b"><CardTitle className="text-lg">{e.auditorNotes}</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-6">
                <Textarea value={auditorNotes} onChange={(ev) => setAuditorNotes(ev.target.value)} placeholder={e.notesPlaceholder} rows={4} />
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground"><p className="flex items-center gap-2"><Lock className="h-4 w-4" />{e.lockWarning}</p></div>
                  <Button size="lg" onClick={handleSubmit} disabled={submitting || requiresCashComment} className="min-w-[200px] min-h-[52px] h-14 text-base font-semibold">
                    {submitting ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" />{e.submitting}</>) : (<><Send className="h-5 w-5 mr-2" />{e.submitAudit}</>)}
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
