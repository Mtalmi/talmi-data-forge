import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Moon, 
  AlertTriangle, 
  Shield, 
  Download,
  Loader2,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

interface NightActivity {
  id: string;
  type: 'expense' | 'stock' | 'bl';
  description: string;
  amount?: number;
  user_name: string;
  justification?: string;
  created_at: string;
}

interface CapBreach {
  id: string;
  user_name: string;
  attempted_amount: number;
  monthly_total: number;
  cap_limit: number;
  created_at: string;
  was_overridden: boolean;
}

interface HawaiiReportData {
  nightActivities: NightActivity[];
  capBreaches: CapBreach[];
  totalNightTransactions: number;
  totalNightAmount: number;
  totalCapBreaches: number;
  successfulOverrides: number;
  reportDate: string;
}

export function HawaiiReportButton() {
  const { isCeo, isSuperviseur } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState<HawaiiReportData | null>(null);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    
    try {
      const today = new Date();
      const startDate = startOfDay(subDays(today, 7)); // Last 7 days
      const endDate = endOfDay(today);
      
      // Fetch night activities (18:00 - 06:00)
      const [expensesRes, stocksRes, blsRes, auditRes] = await Promise.all([
        // Night expenses
        supabase
          .from('expenses_controlled')
          .select('id, description, montant_ht, created_by_name, justification_urgence, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        // Night stock receptions
        supabase
          .from('stock_receptions_pending')
          .select('id, materiau, quantite, agent_name, justification_urgence, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        // Night BLs
        supabase
          .from('bons_livraison_reels')
          .select('bl_id, client_id, volume_m3, chauffeur_nom, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        // Cap breach attempts from audit logs
        supabase
          .from('audit_logs')
          .select('*')
          .eq('action_type', 'LIMIT_EXCEEDED')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      ]);

      // Filter for night hours (18:00 - 06:00)
      const isNightHour = (timestamp: string): boolean => {
        const date = new Date(timestamp);
        const hour = parseInt(
          date.toLocaleString('en-US', { 
            timeZone: 'Africa/Casablanca', 
            hour: 'numeric', 
            hour12: false 
          })
        );
        return hour >= 18 || hour < 6;
      };

      const nightActivities: NightActivity[] = [];
      let totalNightAmount = 0;

      // Process night expenses
      (expensesRes.data || []).forEach((exp: any) => {
        if (isNightHour(exp.created_at)) {
          nightActivities.push({
            id: exp.id,
            type: 'expense',
            description: exp.description || 'Dépense',
            amount: exp.montant_ht,
            user_name: exp.created_by_name || 'Inconnu',
            justification: exp.justification_urgence,
            created_at: exp.created_at
          });
          totalNightAmount += exp.montant_ht || 0;
        }
      });

      // Process night stocks
      (stocksRes.data || []).forEach((stock: any) => {
        if (isNightHour(stock.created_at)) {
          nightActivities.push({
            id: stock.id,
            type: 'stock',
            description: `Réception ${stock.materiau}: ${stock.quantite}T`,
            user_name: stock.agent_name || 'Inconnu',
            justification: stock.justification_urgence,
            created_at: stock.created_at
          });
        }
      });

      // Process night BLs
      (blsRes.data || []).forEach((bl: any) => {
        if (isNightHour(bl.created_at)) {
          nightActivities.push({
            id: bl.bl_id,
            type: 'bl',
            description: `Livraison ${bl.volume_m3}m³`,
            user_name: bl.chauffeur_nom || 'Inconnu',
            created_at: bl.created_at
          });
        }
      });

      // Process cap breaches
      const capBreaches: CapBreach[] = (auditRes.data || []).map((log: any) => ({
        id: log.id,
        user_name: log.user_name || 'Inconnu',
        attempted_amount: log.new_data?.attempted_amount || 0,
        monthly_total: log.new_data?.monthly_total || 0,
        cap_limit: 15000,
        created_at: log.created_at,
        was_overridden: log.new_data?.was_overridden || false
      }));

      // Sort by date descending
      nightActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setReportData({
        nightActivities,
        capBreaches,
        totalNightTransactions: nightActivities.length,
        totalNightAmount,
        totalCapBreaches: capBreaches.length,
        successfulOverrides: capBreaches.filter(b => b.was_overridden).length,
        reportDate: format(today, 'dd MMMM yyyy', { locale: fr })
      });

    } catch (error) {
      console.error('Error fetching Hawaii report:', error);
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !reportData) {
      await fetchReportData();
    }
  };

  const exportToPdf = async () => {
    if (!reportData) return;
    
    setExporting(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFillColor(5, 5, 5);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 215, 0);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('HAWAII REPORT', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(180, 180, 180);
      doc.text(`Rapport de Surveillance - ${reportData.reportDate}`, pageWidth / 2, 32, { align: 'center' });
      
      yPos = 55;
      
      // Summary Cards
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RÉSUMÉ EXÉCUTIF', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`• Transactions Nocturnes (18h-06h): ${reportData.totalNightTransactions}`, 25, yPos);
      yPos += 8;
      doc.text(`• Montant Total Nuit: ${reportData.totalNightAmount.toLocaleString('fr-FR')} MAD`, 25, yPos);
      yPos += 8;
      doc.text(`• Tentatives Dépassement 15k: ${reportData.totalCapBreaches}`, 25, yPos);
      yPos += 8;
      doc.text(`• Overrides CEO Accordés: ${reportData.successfulOverrides}`, 25, yPos);
      yPos += 20;
      
      // Night Activities Section
      if (reportData.nightActivities.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ACTIVITÉ NOCTURNE (18h-06h)', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        reportData.nightActivities.slice(0, 15).forEach((activity) => {
          const time = format(new Date(activity.created_at), 'dd/MM HH:mm');
          const typeLabel = activity.type === 'expense' ? '💰' : activity.type === 'stock' ? '📦' : '🚚';
          doc.text(`${typeLabel} ${time} - ${activity.description} (${activity.user_name})`, 25, yPos);
          yPos += 6;
          
          if (activity.justification) {
            doc.setTextColor(100, 100, 100);
            doc.text(`   Justification: ${activity.justification.substring(0, 50)}...`, 30, yPos);
            doc.setTextColor(50, 50, 50);
            yPos += 6;
          }
          
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
        });
      }
      
      yPos += 10;
      
      // Cap Breaches Section
      if (reportData.capBreaches.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ALERTES PLAFOND 15K MAD', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        reportData.capBreaches.forEach((breach) => {
          const time = format(new Date(breach.created_at), 'dd/MM HH:mm');
          const status = breach.was_overridden ? '✅ Override' : '🚫 Bloqué';
          doc.text(`${status} ${time} - ${breach.user_name}: ${breach.attempted_amount.toLocaleString()} MAD`, 25, yPos);
          yPos += 6;
        });
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')} - TBOS Hawaii Monitor`, pageWidth / 2, 285, { align: 'center' });
      
      // Save
      doc.save(`hawaii-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Rapport Hawaii exporté en PDF');
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  if (!isCeo && !isSuperviseur) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50 text-amber-600 dark:text-amber-400"
        >
          <Moon className="h-4 w-4" />
          <span className="hidden sm:inline">Hawaii Report</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <Moon className="h-5 w-5 text-white" />
            </div>
            Hawaii Report - Surveillance Nocturne
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : reportData ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-slate-900/50 border-amber-500/20">
                <CardContent className="p-3 text-center">
                  <Moon className="h-5 w-5 mx-auto mb-1 text-amber-400" />
                  <p className="text-2xl font-bold text-amber-400">{reportData.totalNightTransactions}</p>
                  <p className="text-[10px] text-muted-foreground">Trans. Nuit</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900/50 border-amber-500/20">
                <CardContent className="p-3 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-amber-400" />
                  <p className="text-lg font-bold text-amber-400">
                    {(reportData.totalNightAmount / 1000).toFixed(1)}K
                  </p>
                  <p className="text-[10px] text-muted-foreground">MAD Nuit</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900/50 border-red-500/20">
                <CardContent className="p-3 text-center">
                  <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-400" />
                  <p className="text-2xl font-bold text-red-400">{reportData.totalCapBreaches}</p>
                  <p className="text-[10px] text-muted-foreground">Cap Breaches</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900/50 border-emerald-500/20">
                <CardContent className="p-3 text-center">
                  <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
                  <p className="text-2xl font-bold text-emerald-400">{reportData.successfulOverrides}</p>
                  <p className="text-[10px] text-muted-foreground">CEO Override</p>
                </CardContent>
              </Card>
            </div>

            <ScrollArea className="h-[350px] pr-4">
              {/* Night Activities */}
              {reportData.nightActivities.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Moon className="h-4 w-4 text-amber-400" />
                    Activité Nocturne (18h-06h)
                  </h4>
                  
                  {reportData.nightActivities.map((activity) => (
                    <div 
                      key={activity.id}
                      className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px]",
                                activity.type === 'expense' && "border-amber-500/50 text-amber-500",
                                activity.type === 'stock' && "border-blue-500/50 text-blue-500",
                                activity.type === 'bl' && "border-emerald-500/50 text-emerald-500"
                              )}
                            >
                              {activity.type === 'expense' ? '💰 Dépense' : 
                               activity.type === 'stock' ? '📦 Stock' : '🚚 Livraison'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(activity.created_at), 'dd/MM HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">Par: {activity.user_name}</p>
                          {activity.justification && (
                            <p className="text-xs text-amber-500/80 mt-1 italic">
                              "{activity.justification}"
                            </p>
                          )}
                        </div>
                        {activity.amount && (
                          <span className="text-sm font-bold text-amber-400">
                            {activity.amount.toLocaleString()} MAD
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cap Breaches */}
              {reportData.capBreaches.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-400" />
                    Alertes Plafond 15K MAD
                  </h4>
                  
                  {reportData.capBreaches.map((breach) => (
                    <div 
                      key={breach.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        breach.was_overridden 
                          ? "bg-emerald-500/5 border-emerald-500/20" 
                          : "bg-red-500/5 border-red-500/20"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={breach.was_overridden ? "default" : "destructive"}
                              className="text-[10px]"
                            >
                              {breach.was_overridden ? '✅ Override Accordé' : '🚫 Bloqué'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(breach.created_at), 'dd/MM HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{breach.user_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Tentative: {breach.attempted_amount.toLocaleString()} MAD
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total Mensuel</p>
                          <p className="text-sm font-bold text-red-400">
                            {breach.monthly_total.toLocaleString()} / 15,000 MAD
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {reportData.nightActivities.length === 0 && reportData.capBreaches.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
                  <p className="font-medium text-emerald-400">Aucune Alerte</p>
                  <p className="text-sm text-muted-foreground">
                    Pas d'activité nocturne ou de dépassement de plafond cette semaine.
                  </p>
                </div>
              )}
            </ScrollArea>

            {/* Export Button */}
            <div className="flex justify-end">
              <Button 
                onClick={exportToPdf} 
                disabled={exporting}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Exporter PDF
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
