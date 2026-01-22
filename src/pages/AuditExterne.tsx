import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentCheck {
  bl_id: string;
  verified: boolean;
  notes: string;
}

interface TruckCheck {
  id_camion: string;
  chauffeur: string;
  app_km: number;
  physical_km: number;
  variance: number;
}

export default function AuditExterne() {
  const { user, isCeo, isAuditeur } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [siloAppLevel, setSiloAppLevel] = useState(0);
  const [siloPhysicalLevel, setSiloPhysicalLevel] = useState(0);
  const [cashAppAmount, setCashAppAmount] = useState(0);
  const [cashPhysicalAmount, setCashPhysicalAmount] = useState(0);
  const [documentChecks, setDocumentChecks] = useState<DocumentCheck[]>([]);
  const [truckChecks, setTruckChecks] = useState<TruckCheck[]>([]);
  const [auditorNotes, setAuditorNotes] = useState('');
  
  // Calculated variances
  const siloVariance = siloAppLevel - siloPhysicalLevel;
  const siloVariancePct = siloAppLevel > 0 ? ((siloVariance / siloAppLevel) * 100).toFixed(2) : '0';
  const cashVariance = cashAppAmount - cashPhysicalAmount;
  const cashVariancePct = cashAppAmount > 0 ? ((cashVariance / cashAppAmount) * 100).toFixed(2) : '0';
  
  const currentPeriod = () => {
    const now = new Date();
    const day = now.getDate();
    const month = format(now, 'yyyy-MM');
    return day <= 15 ? `${month}-Q1` : `${month}-Q2`;
  };

  // Fetch random BLs and Trucks for audit
  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      // Fetch 5 random BLs from last 30 days
      const thirtyDaysAgo = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const { data: blData } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id')
        .gte('date_livraison', thirtyDaysAgo)
        .eq('workflow_status', 'livre')
        .limit(50);
      
      if (blData && blData.length > 0) {
        // Randomly select 5
        const shuffled = [...blData].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5);
        setDocumentChecks(selected.map(bl => ({
          bl_id: bl.bl_id,
          verified: false,
          notes: '',
        })));
      }

      // Fetch 2 random trucks
      const { data: truckData } = await supabase
        .from('flotte')
        .select('id_camion, chauffeur, km_compteur')
        .eq('statut', 'Disponible')
        .limit(10);
      
      if (truckData && truckData.length > 0) {
        const shuffled = [...truckData].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);
        setTruckChecks(selected.map(t => ({
          id_camion: t.id_camion,
          chauffeur: t.chauffeur || 'N/A',
          app_km: t.km_compteur || 0,
          physical_km: 0,
          variance: 0,
        })));
      }

      // Estimate silo level from recent receptions (using type assertion)
      const { data: stockData } = await (supabase
        .from('reception_matieres' as any)
        .select('quantite_tonnes')
        .eq('materiau', 'Ciment')
        .order('date_reception', { ascending: false })
        .limit(1)
        .single() as any);
      
      if (stockData) {
        setSiloAppLevel(stockData.quantite_tonnes || 150);
      } else {
        setSiloAppLevel(150); // Default estimate for demo
      }

      // Fetch current cash from payments (approximation)
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

  const updateTruckKm = (index: number, physicalKm: number) => {
    setTruckChecks(prev => prev.map((t, i) => {
      if (i === index) {
        return {
          ...t,
          physical_km: physicalKm,
          variance: t.app_km - physicalKm,
        };
      }
      return t;
    }));
  };

  const toggleDocumentVerified = (index: number) => {
    setDocumentChecks(prev => prev.map((d, i) => {
      if (i === index) {
        return { ...d, verified: !d.verified };
      }
      return d;
    }));
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    setSubmitting(true);
    try {
      const verifiedCount = documentChecks.filter(d => d.verified).length;
      const missingCount = documentChecks.filter(d => !d.verified).length;

      // Insert the audit record using type assertion for new table
      const { data: auditData, error: insertError } = await (supabase
        .from('audits_externes' as any)
        .insert([{
          audit_period: currentPeriod(),
          silo_app_level_tonnes: siloAppLevel,
          silo_physical_level_tonnes: siloPhysicalLevel,
          cash_app_amount: cashAppAmount,
          cash_physical_amount: cashPhysicalAmount,
          document_checks: documentChecks,
          documents_verified_count: verifiedCount,
          documents_missing_count: missingCount,
          truck_checks: truckChecks,
          auditor_id: user.id,
          auditor_notes: auditorNotes,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        }])
        .select()
        .single() as any);

      if (insertError) throw insertError;

      // Call edge function to generate PDF and send email
      const { error: emailError } = await supabase.functions.invoke('send-audit-report', {
        body: {
          auditId: auditData.id,
          auditPeriod: currentPeriod(),
          siloAppLevel,
          siloPhysicalLevel,
          siloVariance,
          siloVariancePct,
          cashAppAmount,
          cashPhysicalAmount,
          cashVariance,
          cashVariancePct,
          documentChecks,
          verifiedCount,
          missingCount,
          truckChecks,
          auditorNotes,
          submittedAt: new Date().toISOString(),
        },
      });

      if (emailError) {
        console.error('Email error:', emailError);
        toast.warning('Audit soumis mais erreur d\'envoi email');
      } else {
        // Update the record to mark email as sent
        await (supabase
          .from('audits_externes' as any)
          .update({ 
            email_sent: true, 
            email_sent_at: new Date().toISOString() 
          })
          .eq('id', auditData?.id) as any);
      }

      toast.success('Audit soumis avec succès! Rapport envoyé au CEO.');
      
      // Reset form
      fetchAuditData();
      setAuditorNotes('');
      setSiloPhysicalLevel(0);
      setCashPhysicalAmount(0);

    } catch (error) {
      console.error('Error submitting audit:', error);
      toast.error('Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const getVarianceBadge = (variance: number, pct: string) => {
    const pctNum = parseFloat(pct);
    if (Math.abs(pctNum) <= 2) {
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">OK ({pct}%)</Badge>;
    } else if (Math.abs(pctNum) <= 5) {
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Attention ({pct}%)</Badge>;
    } else {
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Critique ({pct}%)</Badge>;
    }
  };

  if (!isCeo && !isAuditeur) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Accès Restreint</h2>
              <p className="text-muted-foreground">
                Cette page est réservée aux auditeurs externes et au CEO.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              Portail Audit Externe
            </h1>
            <p className="text-muted-foreground">
              Audit Bi-Mensuel - Période: {currentPeriod()}
            </p>
          </div>
          <Button variant="outline" onClick={fetchAuditData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Rafraîchir
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Chargement des données d'audit...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Silo Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cylinder className="h-5 w-5 text-blue-500" />
                  Vérification Silo Ciment
                </CardTitle>
                <CardDescription>Comparez le niveau système vs physique</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Niveau Système (tonnes)</Label>
                    <Input 
                      type="number" 
                      value={siloAppLevel}
                      onChange={(e) => setSiloAppLevel(parseFloat(e.target.value) || 0)}
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Niveau Physique (tonnes)</Label>
                    <Input 
                      type="number" 
                      value={siloPhysicalLevel}
                      onChange={(e) => setSiloPhysicalLevel(parseFloat(e.target.value) || 0)}
                      placeholder="Entrez le niveau mesuré"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Écart:</span>
                    <span className={cn(
                      "font-semibold",
                      Math.abs(siloVariance) > siloAppLevel * 0.05 ? "text-red-500" : "text-emerald-500"
                    )}>
                      {siloVariance.toFixed(2)} T
                    </span>
                  </div>
                  {getVarianceBadge(siloVariance, siloVariancePct)}
                </div>
              </CardContent>
            </Card>

            {/* Cash Audit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-emerald-500" />
                  Audit Caisse
                </CardTitle>
                <CardDescription>Vérification encaissements période</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Montant Système (DH)</Label>
                    <Input 
                      type="number" 
                      value={cashAppAmount}
                      onChange={(e) => setCashAppAmount(parseFloat(e.target.value) || 0)}
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Montant Physique (DH)</Label>
                    <Input 
                      type="number" 
                      value={cashPhysicalAmount}
                      onChange={(e) => setCashPhysicalAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Entrez le montant compté"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Écart:</span>
                    <span className={cn(
                      "font-semibold",
                      Math.abs(cashVariance) > cashAppAmount * 0.02 ? "text-red-500" : "text-emerald-500"
                    )}>
                      {cashVariance.toLocaleString()} DH
                    </span>
                  </div>
                  {getVarianceBadge(cashVariance, cashVariancePct)}
                </div>
              </CardContent>
            </Card>

            {/* Document Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  Vérification Documents
                </CardTitle>
                <CardDescription>5 BL sélectionnés aléatoirement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documentChecks.map((doc, index) => (
                    <div 
                      key={doc.bl_id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        doc.verified 
                          ? "bg-emerald-500/5 border-emerald-500/30" 
                          : "bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={doc.verified}
                          onCheckedChange={() => toggleDocumentVerified(index)}
                        />
                        <span className="font-mono text-sm">{doc.bl_id}</span>
                      </div>
                      <Badge variant={doc.verified ? "default" : "secondary"}>
                        {doc.verified ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Vérifié
                          </span>
                        ) : (
                          'À vérifier'
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span className="text-emerald-600">
                    ✓ {documentChecks.filter(d => d.verified).length} vérifiés
                  </span>
                  <span className="text-red-500">
                    ✗ {documentChecks.filter(d => !d.verified).length} manquants
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Truck Odometer Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-violet-500" />
                  Vérification Compteurs Camions
                </CardTitle>
                <CardDescription>2 camions sélectionnés aléatoirement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {truckChecks.map((truck, index) => (
                    <div key={truck.id_camion} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-semibold">{truck.id_camion}</span>
                          <span className="text-sm text-muted-foreground ml-2">({truck.chauffeur})</span>
                        </div>
                        {truck.physical_km > 0 && (
                          <Badge variant={Math.abs(truck.variance) > 100 ? "destructive" : "secondary"}>
                            Écart: {truck.variance} km
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">KM Système</Label>
                          <Input 
                            type="number" 
                            value={truck.app_km}
                            disabled
                            className="bg-muted h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">KM Physique</Label>
                          <Input 
                            type="number" 
                            value={truck.physical_km || ''}
                            onChange={(e) => updateTruckKm(index, parseFloat(e.target.value) || 0)}
                            placeholder="Compteur actuel"
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Auditor Notes & Submit */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Notes & Observations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={auditorNotes}
                  onChange={(e) => setAuditorNotes(e.target.value)}
                  placeholder="Ajoutez vos observations, anomalies constatées, recommandations..."
                  rows={4}
                />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Le rapport sera envoyé automatiquement à max.talmi@gmail.com
                  </div>
                  <Button 
                    size="lg" 
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="gap-2"
                  >
                    {submitting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Soumettre l'Audit
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