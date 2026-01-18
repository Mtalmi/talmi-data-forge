import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function DailyReportGenerator() {
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);

    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // Fetch today's data
      const [facturesRes, blRes, depensesRes, clientsRes] = await Promise.all([
        supabase
          .from('factures')
          .select('total_ht, total_ttc, cur_reel, marge_brute_pct, volume_m3')
          .gte('date_emission', startOfDay)
          .lte('date_emission', endOfDay),
        supabase
          .from('bons_livraison_reels')
          .select('bl_id, volume_m3, statut_paiement, workflow_status, cur_reel, marge_brute_pct')
          .gte('date_livraison', startOfDay.split('T')[0])
          .lte('date_livraison', endOfDay.split('T')[0]),
        supabase
          .from('depenses')
          .select('montant, categorie')
          .gte('date_depense', startOfDay.split('T')[0])
          .lte('date_depense', endOfDay.split('T')[0]),
        supabase
          .from('clients')
          .select('solde_du, credit_bloque')
          .gt('solde_du', 0),
      ]);

      const factures = facturesRes.data || [];
      const bons = blRes.data || [];
      const depenses = depensesRes.data || [];
      const clientsEnRetard = clientsRes.data || [];

      // Calculate KPIs
      const totalFacture = factures.reduce((sum, f) => sum + (f.total_ht || 0), 0);
      const totalVolume = bons.reduce((sum, b) => sum + (b.volume_m3 || 0), 0);
      const totalDepenses = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);
      const avgCUR = bons.filter(b => b.cur_reel).reduce((sum, b, _, arr) => sum + (b.cur_reel || 0) / arr.length, 0);
      const avgMarge = bons.filter(b => b.marge_brute_pct).reduce((sum, b, _, arr) => sum + (b.marge_brute_pct || 0) / arr.length, 0);
      const totalCout = bons.reduce((sum, b) => sum + ((b.cur_reel || 0) * (b.volume_m3 || 0)), 0);
      const profitNet = totalFacture - totalCout - totalDepenses;
      const nbLivraisons = bons.length;
      const nbFactures = factures.length;
      const retardsPaiement = clientsEnRetard.length;
      const totalSoldeDu = clientsEnRetard.reduce((sum, c) => sum + (c.solde_du || 0), 0);

      // Group expenses by category
      const depensesByCategory: Record<string, number> = {};
      depenses.forEach(d => {
        depensesByCategory[d.categorie] = (depensesByCategory[d.categorie] || 0) + d.montant;
      });

      const dateStr = format(new Date(), 'dd MMMM yyyy', { locale: fr });

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Rapport Journalier - ${dateStr}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 30px; color: #1a1a1a; line-height: 1.4; background: #fff; }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #f59e0b; }
            .logo { font-size: 24px; font-weight: bold; color: #f59e0b; }
            .report-title { font-size: 28px; font-weight: bold; margin-top: 10px; }
            .date { font-size: 14px; color: #666; margin-top: 5px; }
            .hawaii-badge { display: inline-block; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .kpi-card { background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e5e7eb; }
            .kpi-card.positive { background: #dcfce7; border-color: #22c55e; }
            .kpi-card.negative { background: #fee2e2; border-color: #ef4444; }
            .kpi-card.warning { background: #fef3c7; border-color: #f59e0b; }
            .kpi-value { font-size: 28px; font-weight: bold; color: #1a1a1a; font-family: 'Courier New', monospace; }
            .kpi-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 14px; font-weight: bold; color: #374151; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #e5e7eb; }
            .profit-box { background: ${profitNet >= 0 ? '#dcfce7' : '#fee2e2'}; border: 2px solid ${profitNet >= 0 ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px; }
            .profit-label { font-size: 14px; color: #666; text-transform: uppercase; }
            .profit-value { font-size: 36px; font-weight: bold; color: ${profitNet >= 0 ? '#16a34a' : '#dc2626'}; font-family: 'Courier New', monospace; }
            .breakdown { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; }
            .breakdown-item { text-align: center; padding: 10px; background: white; border-radius: 8px; }
            .breakdown-value { font-size: 16px; font-weight: bold; font-family: 'Courier New', monospace; }
            .breakdown-label { font-size: 10px; color: #666; }
            .table { width: 100%; border-collapse: collapse; }
            .table th, .table td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            .table th { background: #f3f4f6; font-size: 11px; text-transform: uppercase; }
            .table .number { text-align: right; font-family: 'Courier New', monospace; }
            .alert-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
            .alert-title { font-weight: bold; color: #b45309; font-size: 12px; }
            .footer { text-align: center; font-size: 10px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            @media print { body { padding: 15px; } .kpi-grid { grid-template-columns: repeat(4, 1fr); } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">TALMI BETON</div>
            <div class="report-title">Rapport de Clôture Journalier</div>
            <div class="date">${dateStr}</div>
            <div class="hawaii-badge">🌴 HAWAII REPORT</div>
          </div>

          <div class="profit-box">
            <div class="profit-label">Profit Net du Jour</div>
            <div class="profit-value">${profitNet >= 0 ? '+' : ''}${profitNet.toLocaleString('fr-FR')} DH</div>
            <div class="breakdown">
              <div class="breakdown-item">
                <div class="breakdown-value" style="color: #16a34a;">+${totalFacture.toLocaleString('fr-FR')}</div>
                <div class="breakdown-label">Facturé HT</div>
              </div>
              <div class="breakdown-item">
                <div class="breakdown-value" style="color: #dc2626;">-${totalCout.toLocaleString('fr-FR')}</div>
                <div class="breakdown-label">Coût Réel</div>
              </div>
              <div class="breakdown-item">
                <div class="breakdown-value" style="color: #dc2626;">-${totalDepenses.toLocaleString('fr-FR')}</div>
                <div class="breakdown-label">Dépenses</div>
              </div>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-value">${nbLivraisons}</div>
              <div class="kpi-label">Livraisons</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">${totalVolume.toFixed(1)}</div>
              <div class="kpi-label">Volume (m³)</div>
            </div>
            <div class="kpi-card ${avgMarge < 15 ? 'warning' : avgMarge >= 20 ? 'positive' : ''}">
              <div class="kpi-value">${avgMarge.toFixed(1)}%</div>
              <div class="kpi-label">Marge Moyenne</div>
            </div>
            <div class="kpi-card ${avgCUR > 600 ? 'warning' : ''}">
              <div class="kpi-value">${avgCUR.toFixed(0)}</div>
              <div class="kpi-label">CUR Moyen (DH)</div>
            </div>
          </div>

          ${retardsPaiement > 0 ? `
          <div class="alert-box">
            <div class="alert-title">⚠️ ALERTES PAIEMENT</div>
            <p>${retardsPaiement} client(s) avec solde impayé - Total: ${totalSoldeDu.toLocaleString('fr-FR')} DH</p>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Répartition des Dépenses</div>
            ${Object.keys(depensesByCategory).length > 0 ? `
            <table class="table">
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th class="number">Montant</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(depensesByCategory).map(([cat, amount]) => `
                  <tr>
                    <td>${cat}</td>
                    <td class="number">${amount.toLocaleString('fr-FR')} DH</td>
                  </tr>
                `).join('')}
                <tr style="font-weight: bold; background: #f9fafb;">
                  <td>Total</td>
                  <td class="number">${totalDepenses.toLocaleString('fr-FR')} DH</td>
                </tr>
              </tbody>
            </table>
            ` : '<p style="color: #666; text-align: center; padding: 20px;">Aucune dépense enregistrée aujourd\'hui</p>'}
          </div>

          <div class="footer">
            <strong>TALMI BETON SARL</strong> | Rapport généré automatiquement le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}<br>
            Ce rapport est confidentiel et destiné à un usage interne uniquement.
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
        toast.success('Rapport Hawaii généré!');
      } else {
        toast.error('Impossible d\'ouvrir la fenêtre');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button onClick={generateReport} disabled={generating} variant="outline" className="gap-2">
      {generating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      Rapport Hawaii
    </Button>
  );
}
