import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReportingData } from '@/hooks/useReportingData';

interface MonthlyReportPdfGeneratorProps {
  data: ReportingData;
  period: '6m' | '12m' | 'ytd';
}

export function MonthlyReportPdfGenerator({ data, period }: MonthlyReportPdfGeneratorProps) {
  const [generating, setGenerating] = useState(false);

  const getPeriodLabel = () => {
    switch (period) {
      case '6m': return '6 derniers mois';
      case '12m': return '12 derniers mois';
      case 'ytd': return 'Depuis janvier';
      default: return '';
    }
  };

  const generatePdf = async () => {
    setGenerating(true);

    try {
      const today = format(new Date(), "d MMMM yyyy", { locale: fr });
      
      // Generate monthly trend rows
      const monthlyRows = data.monthlyTrends.map(m => `
        <tr>
          <td>${m.monthLabel}</td>
          <td class="number">${m.volume.toLocaleString('fr-FR')} m³</td>
          <td class="number">${m.chiffre_affaires.toLocaleString('fr-FR')} DH</td>
          <td class="number">${m.marge_brute.toLocaleString('fr-FR')} DH</td>
          <td class="number ${m.marge_pct >= 25 ? 'green' : m.marge_pct >= 15 ? 'orange' : 'red'}">${m.marge_pct}%</td>
          <td class="number">${m.depenses.toLocaleString('fr-FR')} DH</td>
          <td class="number ${m.profit_net >= 0 ? 'green' : 'red'}">${m.profit_net.toLocaleString('fr-FR')} DH</td>
        </tr>
      `).join('');

      // Generate client P&L rows (top 10)
      const clientRows = data.clientsPL.slice(0, 10).map((c, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${c.nom_client}</td>
          <td class="number">${c.total_volume.toLocaleString('fr-FR')} m³</td>
          <td class="number">${c.total_ca.toLocaleString('fr-FR')} DH</td>
          <td class="number ${c.marge_brute >= 0 ? 'green' : 'red'}">${c.marge_brute.toLocaleString('fr-FR')} DH</td>
          <td class="number ${c.marge_pct >= 25 ? 'green' : c.marge_pct >= 15 ? 'orange' : 'red'}">${c.marge_pct}%</td>
          <td class="number">${c.nb_livraisons}</td>
        </tr>
      `).join('');

      // Generate formula P&L rows
      const formulaRows = data.formulasPL.map(f => `
        <tr>
          <td><strong>${f.formule_id}</strong><br><span style="font-size:10px;color:#666">${f.designation}</span></td>
          <td class="number">${f.total_volume.toLocaleString('fr-FR')} m³</td>
          <td class="number">${f.total_ca.toLocaleString('fr-FR')} DH</td>
          <td class="number ${f.marge_brute >= 0 ? 'green' : 'red'}">${f.marge_brute.toLocaleString('fr-FR')} DH</td>
          <td class="number ${f.marge_pct >= 25 ? 'green' : f.marge_pct >= 15 ? 'orange' : 'red'}">${f.marge_pct}%</td>
          <td class="number">${f.avg_cur.toLocaleString('fr-FR')} DH/m³</td>
        </tr>
      `).join('');

      // Generate forecast rows
      const forecastRows = data.forecast.map(f => `
        <tr>
          <td>${f.month}</td>
          <td class="number">${f.predicted_volume.toLocaleString('fr-FR')} m³</td>
          <td class="number">${f.predicted_ca.toLocaleString('fr-FR')} DH</td>
          <td class="number">${f.confidence}%</td>
          <td class="${f.trend === 'up' ? 'green' : f.trend === 'down' ? 'red' : ''}">${f.trend === 'up' ? '↑ Haussière' : f.trend === 'down' ? '↓ Baissière' : '→ Stable'}</td>
        </tr>
      `).join('');

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Rapport Business Intelligence - ${getPeriodLabel()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Helvetica', 'Arial', sans-serif; 
              padding: 30px; 
              color: #1a1a1a;
              line-height: 1.5;
              font-size: 11px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              border-bottom: 4px solid #3b82f6;
              padding-bottom: 15px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #3b82f6;
            }
            .logo-sub {
              font-size: 11px;
              color: #666;
            }
            .report-info {
              text-align: right;
            }
            .report-title {
              font-size: 16px;
              font-weight: bold;
              color: #1f2937;
              background: #dbeafe;
              padding: 8px 15px;
              border-radius: 6px;
            }
            .report-date {
              font-size: 10px;
              color: #666;
              margin-top: 5px;
            }
            
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 25px;
            }
            .kpi-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .kpi-label {
              font-size: 10px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kpi-value {
              font-size: 20px;
              font-weight: bold;
              color: #1e293b;
              margin-top: 5px;
            }
            .kpi-value.primary { color: #3b82f6; }
            .kpi-value.success { color: #16a34a; }
            .kpi-value.warning { color: #f59e0b; }
            
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 13px;
              font-weight: bold;
              color: #3b82f6;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 10px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 5px;
            }
            
            .table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            .table th {
              background: #1e293b;
              color: white;
              padding: 8px 6px;
              text-align: left;
              font-weight: 600;
              font-size: 9px;
              text-transform: uppercase;
            }
            .table td {
              padding: 8px 6px;
              border-bottom: 1px solid #e2e8f0;
            }
            .table tr:nth-child(even) {
              background: #f8fafc;
            }
            .table .number {
              text-align: right;
              font-family: 'Courier New', monospace;
            }
            .green { color: #16a34a; font-weight: bold; }
            .red { color: #dc2626; font-weight: bold; }
            .orange { color: #f59e0b; font-weight: bold; }
            
            .two-columns {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            
            .highlight-box {
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              border: 2px solid #3b82f6;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .highlight-title {
              font-size: 12px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 10px;
            }
            
            .alert-box {
              background: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 20px;
            }
            .alert-title {
              font-weight: bold;
              color: #b45309;
              margin-bottom: 5px;
            }
            
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 9px;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            @media print {
              body { padding: 15px; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <!-- PAGE 1: Executive Summary -->
          <div class="header">
            <div>
              <div class="logo">TALMI BETON</div>
              <div class="logo-sub">Centrale à Béton - Excellence & Performance</div>
            </div>
            <div class="report-info">
              <div class="report-title">📊 RAPPORT BI - ${getPeriodLabel().toUpperCase()}</div>
              <div class="report-date">Généré le ${today}</div>
            </div>
          </div>

          <div class="highlight-box">
            <div class="highlight-title">🎯 RÉSUMÉ EXÉCUTIF</div>
            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-label">Chiffre d'Affaires</div>
                <div class="kpi-value primary">${(data.summary.totalCA / 1000).toFixed(0)} K DH</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Profit Net</div>
                <div class="kpi-value success">${(data.summary.profitNet / 1000).toFixed(0)} K DH</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Volume Total</div>
                <div class="kpi-value">${data.summary.totalVolume.toLocaleString('fr-FR')} m³</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Marge Moyenne</div>
                <div class="kpi-value warning">${data.summary.avgMargePct}%</div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px;">
              <div style="text-align: center;">
                <span style="color: #64748b; font-size: 10px;">Clients Actifs</span><br>
                <strong style="font-size: 16px;">${data.summary.nbClients}</strong>
              </div>
              <div style="text-align: center;">
                <span style="color: #64748b; font-size: 10px;">Livraisons</span><br>
                <strong style="font-size: 16px;">${data.summary.nbLivraisons}</strong>
              </div>
              <div style="text-align: center;">
                <span style="color: #64748b; font-size: 10px;">Dépenses</span><br>
                <strong style="font-size: 16px; color: #dc2626;">${(data.summary.totalDepenses / 1000).toFixed(0)} K DH</strong>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📈 Évolution Mensuelle</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Volume</th>
                  <th>CA</th>
                  <th>Marge Brute</th>
                  <th>Marge %</th>
                  <th>Dépenses</th>
                  <th>Profit Net</th>
                </tr>
              </thead>
              <tbody>
                ${monthlyRows}
              </tbody>
            </table>
          </div>

          <!-- PAGE 2: Client & Formula Analysis -->
          <div class="page-break"></div>
          
          <div class="header">
            <div>
              <div class="logo">TALMI BETON</div>
              <div class="logo-sub">Rapport BI - Analyse Détaillée</div>
            </div>
            <div class="report-info">
              <div style="font-size: 12px; color: #666;">Page 2/3</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">👥 Top 10 Clients par Rentabilité</div>
            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Volume</th>
                  <th>CA</th>
                  <th>Marge</th>
                  <th>Marge %</th>
                  <th>Livraisons</th>
                </tr>
              </thead>
              <tbody>
                ${clientRows}
              </tbody>
            </table>
          </div>

          ${data.bottomClients.some(c => c.marge_pct < 20) ? `
          <div class="alert-box">
            <div class="alert-title">⚠️ CLIENTS À SURVEILLER (Marge < 20%)</div>
            <p>${data.bottomClients.filter(c => c.marge_pct < 20).map(c => `${c.nom_client} (${c.marge_pct}%)`).join(' | ')}</p>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">🧪 Performance par Formule Béton</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Formule</th>
                  <th>Volume</th>
                  <th>CA</th>
                  <th>Marge</th>
                  <th>Marge %</th>
                  <th>CUR Moyen</th>
                </tr>
              </thead>
              <tbody>
                ${formulaRows}
              </tbody>
            </table>
          </div>

          <!-- PAGE 3: Forecasting -->
          <div class="page-break"></div>
          
          <div class="header">
            <div>
              <div class="logo">TALMI BETON</div>
              <div class="logo-sub">Rapport BI - Prévisions</div>
            </div>
            <div class="report-info">
              <div style="font-size: 12px; color: #666;">Page 3/3</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🔮 Prévisions 3 Mois</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Volume Prévu</th>
                  <th>CA Prévu</th>
                  <th>Confiance</th>
                  <th>Tendance</th>
                </tr>
              </thead>
              <tbody>
                ${forecastRows}
              </tbody>
            </table>
            <p style="margin-top: 10px; font-size: 9px; color: #64748b; font-style: italic;">
              * Prévisions basées sur une moyenne mobile des 3 derniers mois, ajustée selon la tendance observée.
            </p>
          </div>

          <div class="highlight-box" style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-color: #16a34a;">
            <div class="highlight-title" style="color: #15803d;">💡 RECOMMANDATIONS</div>
            <ul style="margin-left: 20px; font-size: 11px;">
              ${data.summary.avgMargePct < 25 ? '<li>La marge moyenne est inférieure à l\'objectif de 25%. Revoir les prix de vente ou optimiser les coûts de production.</li>' : '<li>La marge moyenne est conforme à l\'objectif. Maintenir le cap!</li>'}
              ${data.bottomClients.some(c => c.marge_pct < 15) ? '<li>Certains clients présentent des marges critiques (<15%). Envisager une renégociation tarifaire.</li>' : ''}
              ${data.forecast[0]?.trend === 'up' ? '<li>Tendance haussière détectée. Préparer les capacités de production pour répondre à la demande.</li>' : ''}
              ${data.forecast[0]?.trend === 'down' ? '<li>Tendance baissière détectée. Intensifier les efforts commerciaux et surveiller le pipeline.</li>' : ''}
              <li>Continuer le suivi mensuel des KPIs pour détecter rapidement les anomalies.</li>
            </ul>
          </div>

          <div class="footer">
            <strong>RAPPORT CONFIDENTIEL - TALMI BETON SARL</strong><br>
            Document généré automatiquement par le système TBOS (Talmi Beton Operating System)<br>
            Zone Industrielle - Casablanca | contact@talmibeton.ma
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
        toast.success('Rapport PDF prêt à imprimer');
      } else {
        toast.error('Impossible d\'ouvrir la fenêtre d\'impression');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button variant="outline" onClick={generatePdf} disabled={generating} className="gap-2">
      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      Exporter
    </Button>
  );
}
