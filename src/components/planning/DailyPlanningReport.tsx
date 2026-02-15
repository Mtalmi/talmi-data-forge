import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  FileText, 
  Printer, 
  MessageCircle, 
  Mail, 
  Loader2,
  Calendar,
  Clock,
  Truck,
  Send,
  CheckCircle,
  Package,
  FileDown
} from 'lucide-react';
import { format } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { toast } from 'sonner';

interface DeliveryItem {
  bl_id: string;
  client_name: string;
  formule_id: string;
  volume_m3: number;
  heure_prevue?: string | null;
  toupie_assignee?: string | null;
  workflow_status: string;
}

interface DailyStats {
  totalDeliveries: number;
  pendingCount: number;
  trucksAvailable: number;
  trucksTotal: number;
  enRouteCount: number;
  totalVolume: number;
  deliveredCount: number;
}

interface DailyPlanningReportProps {
  date: Date;
  stats: DailyStats;
  deliveries: DeliveryItem[];
}

export function DailyPlanningReport({ date, stats, deliveries }: DailyPlanningReportProps) {
  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const [open, setOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const formattedDate = format(date, "EEEE d MMMM yyyy", { locale: dateLocale });

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'en_attente_validation': '⏳ En attente',
      'planification': '📋 Planifié',
      'production': '🔧 En production',
      'en_chargement': '🚚 Chargement',
      'en_livraison': '🛣️ En route',
      'livre': '✅ Livré',
    };
    return labels[status] || status;
  };

  const generatePrintContent = (): string => {
    const deliveryRows = deliveries.map(d => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${d.bl_id}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${d.client_name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${d.formule_id}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${d.volume_m3} m³</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${d.heure_prevue || '--:--'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${d.toupie_assignee || 'Non assigné'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${getStatusLabel(d.workflow_status)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Planning du ${formattedDate}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            color: #000;
            line-height: 1.4;
            font-size: 11pt;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .logo {
            font-size: 24pt;
            font-weight: bold;
            letter-spacing: 2px;
          }
          .logo-sub {
            font-size: 10pt;
            margin-top: 5px;
          }
          .date-box {
            text-align: right;
            border: 2px solid #000;
            padding: 15px 20px;
          }
          .date-title {
            font-size: 10pt;
            text-transform: uppercase;
            color: #666;
          }
          .date-value {
            font-size: 14pt;
            font-weight: bold;
            text-transform: capitalize;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }
          .stat-box {
            border: 2px solid #000;
            padding: 15px;
            text-align: center;
          }
          .stat-value {
            font-size: 28pt;
            font-weight: bold;
          }
          .stat-label {
            font-size: 9pt;
            text-transform: uppercase;
            color: #666;
            margin-top: 5px;
          }
          .deliveries-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .deliveries-table th {
            background: #f0f0f0;
            padding: 10px 8px;
            border: 1px solid #000;
            font-size: 9pt;
            text-transform: uppercase;
            text-align: left;
          }
          .deliveries-table td {
            padding: 8px;
            border: 1px solid #ddd;
            font-size: 10pt;
          }
          .deliveries-table tr:nth-child(even) {
            background: #f9f9f9;
          }
          .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 25px;
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 8pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
          .print-time {
            font-size: 8pt;
            color: #999;
            text-align: right;
            margin-top: 10px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">TALMI BETON</div>
            <div class="logo-sub">Béton Prêt à l'Emploi - Planning Journalier</div>
          </div>
          <div class="date-box">
            <div class="date-title">Date</div>
            <div class="date-value">${formattedDate}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-value">${stats.totalDeliveries}</div>
            <div class="stat-label">Livraisons</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${stats.pendingCount}</div>
            <div class="stat-label">En attente</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${stats.trucksAvailable}/${stats.trucksTotal}</div>
            <div class="stat-label">Camions dispo</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${stats.enRouteCount}</div>
            <div class="stat-label">En route</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${stats.deliveredCount}</div>
            <div class="stat-label">Livrés</div>
          </div>
          <div class="stat-box">
            <div class="stat-value" style="font-size: 22pt;">${stats.totalVolume} m³</div>
            <div class="stat-label">Volume total</div>
          </div>
        </div>

        <div class="section-title">Détail des Livraisons</div>
        <table class="deliveries-table">
          <thead>
            <tr>
              <th>N° BL</th>
              <th>Client</th>
              <th>Formule</th>
              <th style="text-align: center;">Volume</th>
              <th style="text-align: center;">Heure</th>
              <th>Camion</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${deliveryRows || '<tr><td colspan="7" style="text-align: center; padding: 20px;">Aucune livraison programmée</td></tr>'}
          </tbody>
        </table>

        <div class="print-time">
          Imprimé le ${format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: dateLocale })}
        </div>

        <div class="footer">
          <strong>TALMI BETON SARL</strong> | Zone Industrielle - Casablanca | Tél: +212 5XX XXX XXX
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const printContent = generatePrintContent();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
        toast.success('Rapport prêt à imprimer');
      } else {
        toast.error("Impossible d'ouvrir la fenêtre d'impression");
      }
    } catch (error) {
      console.error('Error printing report:', error);
      toast.error("Erreur lors de l'impression");
    } finally {
      setPrinting(false);
    }
  };

  const handlePdfExport = async () => {
    setExporting(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const pdfContent = generatePrintContent();
      
      // Create a new window for PDF export with save dialog trigger
      const pdfWindow = window.open('', '_blank');
      if (pdfWindow) {
        // Add download-specific styles and auto-trigger print for PDF save
        const pdfHtml = pdfContent.replace(
          '</style>',
          `
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          </style>
          <script>
            window.onload = function() {
              document.title = 'Planning_TALMI_${dateStr}';
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>`
        );
        
        pdfWindow.document.write(pdfHtml);
        pdfWindow.document.close();
        toast.success('PDF prêt - Utilisez "Enregistrer en PDF" dans la boîte de dialogue');
      } else {
        toast.error("Impossible d'ouvrir la fenêtre d'export");
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleWhatsAppShare = () => {
    const deliveryList = deliveries.slice(0, 10).map(d => 
      `• ${d.heure_prevue || '--:--'} - ${d.client_name} (${d.volume_m3}m³)`
    ).join('\n');

    const message = [
      `📋 *Planning TALMI BETON*`,
      `📅 ${formattedDate}`,
      '',
      `📊 *Résumé:*`,
      `• ${stats.totalDeliveries} livraisons programmées`,
      `• ${stats.totalVolume} m³ volume total`,
      `• ${stats.trucksAvailable}/${stats.trucksTotal} camions disponibles`,
      '',
      `🚚 *Livraisons:*`,
      deliveryList || 'Aucune livraison',
      deliveries.length > 10 ? `... et ${deliveries.length - 10} autres` : '',
      '',
      `_Rapport généré à ${format(new Date(), 'HH:mm')}_`,
    ].filter(Boolean).join('\n');

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    toast.success('WhatsApp ouvert');
  };

  const handleEmailShare = () => {
    const deliveryList = deliveries.map(d => 
      `- ${d.heure_prevue || '--:--'} | ${d.client_name} | ${d.formule_id} | ${d.volume_m3}m³`
    ).join('%0D%0A');

    const subject = encodeURIComponent(`Planning TALMI BETON - ${formattedDate}`);
    const body = encodeURIComponent(
      `Planning du ${formattedDate}\n\n` +
      `RÉSUMÉ:\n` +
      `• ${stats.totalDeliveries} livraisons programmées\n` +
      `• ${stats.totalVolume} m³ volume total\n` +
      `• ${stats.trucksAvailable}/${stats.trucksTotal} camions disponibles\n` +
      `• ${stats.enRouteCount} en route\n` +
      `• ${stats.deliveredCount} livrés\n\n` +
      `LIVRAISONS:\n`
    ) + deliveryList + encodeURIComponent(`\n\n--\nTALMI BETON SARL`);

    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    toast.success('Client email ouvert');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Rapport du jour</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-primary" />
            Planning du {formattedDate}
          </DialogTitle>
        </DialogHeader>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4">
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
            <div className="text-xs text-muted-foreground">Livraisons</div>
          </div>
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <div className="text-xs text-muted-foreground">En attente</div>
          </div>
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Truck className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{stats.trucksAvailable}/{stats.trucksTotal}</div>
            <div className="text-xs text-muted-foreground">Camions dispo</div>
          </div>
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Send className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{stats.enRouteCount}</div>
            <div className="text-xs text-muted-foreground">En route</div>
          </div>
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold">{stats.deliveredCount}</div>
            <div className="text-xs text-muted-foreground">Livrés</div>
          </div>
          <div className="p-3 rounded-lg border bg-primary/10 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">{stats.totalVolume}</div>
            <div className="text-xs text-muted-foreground">m³ total</div>
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Détail des Livraisons</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-2 text-left font-medium">N° BL</th>
                  <th className="p-2 text-left font-medium">Client</th>
                  <th className="p-2 text-left font-medium hidden sm:table-cell">Formule</th>
                  <th className="p-2 text-center font-medium">Volume</th>
                  <th className="p-2 text-center font-medium hidden sm:table-cell">Heure</th>
                  <th className="p-2 text-left font-medium hidden md:table-cell">Camion</th>
                  <th className="p-2 text-left font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      Aucune livraison programmée
                    </td>
                  </tr>
                ) : (
                  deliveries.map((d) => (
                    <tr key={d.bl_id} className="border-t hover:bg-muted/30">
                      <td className="p-2 font-mono text-xs">{d.bl_id}</td>
                      <td className="p-2 font-medium">{d.client_name}</td>
                      <td className="p-2 hidden sm:table-cell">{d.formule_id}</td>
                      <td className="p-2 text-center font-bold">{d.volume_m3} m³</td>
                      <td className="p-2 text-center hidden sm:table-cell">{d.heure_prevue || '--:--'}</td>
                      <td className="p-2 hidden md:table-cell">{d.toupie_assignee || '-'}</td>
                      <td className="p-2">
                        <span className="text-xs">{getStatusLabel(d.workflow_status)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
          <Button onClick={handlePrint} disabled={printing} className="gap-2">
            {printing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Imprimer
          </Button>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                onClick={handlePdfExport}
                disabled={exporting}
                className="gap-2"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                PDF
              </Button>
            </TooltipTrigger>
            <TooltipContent>Télécharger en PDF</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                onClick={handleWhatsAppShare}
                className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </TooltipTrigger>
            <TooltipContent>Partager via WhatsApp</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                onClick={handleEmailShare}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </TooltipTrigger>
            <TooltipContent>Envoyer par email</TooltipContent>
          </Tooltip>
        </div>
      </DialogContent>
    </Dialog>
  );
}
