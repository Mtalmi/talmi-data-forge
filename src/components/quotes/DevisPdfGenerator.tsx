import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DevisPdfGeneratorProps {
  devis: {
    devis_id: string;
    formule_id: string;
    volume_m3: number;
    distance_km: number;
    cut_per_m3: number;
    fixed_cost_per_m3: number;
    transport_extra_per_m3: number;
    total_cost_per_m3: number;
    margin_pct: number;
    prix_vente_m3: number;
    total_ht: number;
    date_expiration: string | null;
    client?: { nom_client: string; adresse: string | null } | null;
    formule?: { designation: string } | null;
  };
}

export default function DevisPdfGenerator({ devis }: DevisPdfGeneratorProps) {
  const [generating, setGenerating] = useState(false);

  const generatePdf = async () => {
    setGenerating(true);
    
    try {
      // Create PDF content using HTML/CSS and print dialog
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Devis ${devis.devis_id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Helvetica', 'Arial', sans-serif; 
              padding: 40px; 
              color: #1a1a1a;
              line-height: 1.6;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              border-bottom: 3px solid #f59e0b;
              padding-bottom: 20px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #f59e0b;
            }
            .logo-sub {
              font-size: 12px;
              color: #666;
            }
            .devis-info {
              text-align: right;
            }
            .devis-id {
              font-size: 20px;
              font-weight: bold;
              color: #333;
            }
            .date {
              font-size: 12px;
              color: #666;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              color: #f59e0b;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 10px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            .client-info {
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
            }
            .client-name {
              font-size: 16px;
              font-weight: bold;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .table th, .table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            .table th {
              background: #f3f4f6;
              font-weight: 600;
              font-size: 12px;
              text-transform: uppercase;
            }
            .table td {
              font-size: 14px;
            }
            .table .number {
              text-align: right;
              font-family: 'Courier New', monospace;
            }
            .total-row {
              background: #fef3c7;
              font-weight: bold;
            }
            .total-row td {
              font-size: 16px;
              border-bottom: 2px solid #f59e0b;
            }
            .price-highlight {
              font-size: 24px;
              color: #f59e0b;
              font-weight: bold;
            }
            .cgv {
              margin-top: 40px;
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
              font-size: 11px;
              color: #666;
            }
            .cgv-title {
              font-weight: bold;
              margin-bottom: 10px;
              color: #333;
            }
            .cgv-list {
              list-style: disc;
              padding-left: 20px;
            }
            .cgv-list li {
              margin-bottom: 5px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 11px;
              color: #666;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            .validity {
              display: inline-block;
              background: #fee2e2;
              color: #dc2626;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
              margin-top: 10px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">TALMI BETON</div>
              <div class="logo-sub">Excellence en Béton Prêt à l'Emploi</div>
            </div>
            <div class="devis-info">
              <div class="devis-id">${devis.devis_id}</div>
              <div class="date">Date: ${new Date().toLocaleDateString('fr-FR')}</div>
              ${devis.date_expiration ? `<div class="validity">Valide jusqu'au ${new Date(devis.date_expiration).toLocaleDateString('fr-FR')}</div>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Client</div>
            <div class="client-info">
              <div class="client-name">${devis.client?.nom_client || 'Client non spécifié'}</div>
              ${devis.client?.adresse ? `<div>${devis.client.adresse}</div>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Détails du Devis</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantité</th>
                  <th>Prix Unitaire</th>
                  <th class="number">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>${devis.formule_id}</strong><br>
                    <span style="color: #666; font-size: 12px;">${devis.formule?.designation || ''}</span>
                  </td>
                  <td>${devis.volume_m3} m³</td>
                  <td class="number">${devis.prix_vente_m3.toLocaleString('fr-FR')} DH/m³</td>
                  <td class="number">${devis.total_ht.toLocaleString('fr-FR')} DH</td>
                </tr>
                ${devis.distance_km > 20 ? `
                <tr>
                  <td colspan="3">Transport supplémentaire (${devis.distance_km - 20} km × 5 DH/m³)</td>
                  <td class="number">${(devis.transport_extra_per_m3 * devis.volume_m3).toLocaleString('fr-FR')} DH</td>
                </tr>
                ` : ''}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3"><strong>TOTAL HT</strong></td>
                  <td class="number price-highlight">${devis.total_ht.toLocaleString('fr-FR')} DH</td>
                </tr>
                <tr>
                  <td colspan="3">TVA (20%)</td>
                  <td class="number">${(devis.total_ht * 0.2).toLocaleString('fr-FR')} DH</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3"><strong>TOTAL TTC</strong></td>
                  <td class="number price-highlight">${(devis.total_ht * 1.2).toLocaleString('fr-FR')} DH</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Décomposition des Coûts (Confidentiel)</div>
            <table class="table">
              <tr>
                <td>Coût Unitaire Théorique (CUT)</td>
                <td class="number">${devis.cut_per_m3.toFixed(2)} DH/m³</td>
              </tr>
              <tr>
                <td>Frais Fixes</td>
                <td class="number">${devis.fixed_cost_per_m3.toFixed(2)} DH/m³</td>
              </tr>
              ${devis.transport_extra_per_m3 > 0 ? `
              <tr>
                <td>Transport Supplémentaire</td>
                <td class="number">${devis.transport_extra_per_m3.toFixed(2)} DH/m³</td>
              </tr>
              ` : ''}
              <tr style="font-weight: bold; background: #f3f4f6;">
                <td>Coût Total / m³</td>
                <td class="number">${devis.total_cost_per_m3.toFixed(2)} DH/m³</td>
              </tr>
              <tr style="color: #16a34a;">
                <td>Marge Appliquée</td>
                <td class="number">${devis.margin_pct}%</td>
              </tr>
            </table>
          </div>

          <div class="cgv">
            <div class="cgv-title">CONDITIONS GÉNÉRALES DE VENTE</div>
            <ul class="cgv-list">
              <li><strong>Livraison:</strong> Livraison gratuite dans un rayon de 20 km. Au-delà, supplément de 5 DH/m³/km.</li>
              <li><strong>Délai de paiement:</strong> 30 jours fin de mois, sauf conditions particulières.</li>
              <li><strong>Validité du devis:</strong> Ce devis est valable 30 jours à compter de sa date d'émission.</li>
              <li><strong>Quantité minimale:</strong> Commande minimum de 2 m³ par livraison.</li>
              <li><strong>Temps d'attente:</strong> Au-delà de 30 minutes sur chantier, facturation de 100 DH/15 minutes.</li>
              <li><strong>Annulation:</strong> Toute commande annulée moins de 24h avant la livraison sera facturée à 50%.</li>
              <li><strong>Conformité:</strong> Le béton est livré conforme aux normes NM 10.1.008.</li>
              <li><strong>Responsabilité:</strong> TALMI BETON n'est pas responsable de l'utilisation du béton après livraison.</li>
            </ul>
          </div>

          <div class="footer">
            <strong>TALMI BETON SARL</strong><br>
            Zone Industrielle - Casablanca | Tél: +212 5XX XXX XXX | Email: contact@talmibeton.ma<br>
            RC: XXXXXX | IF: XXXXXX | ICE: XXXXXXXXXXXXXXX
          </div>
        </body>
        </html>
      `;

      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print();
        }, 500);
        
        toast.success('PDF prêt pour impression/téléchargement');
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
    <Button
      variant="outline"
      size="sm"
      onClick={generatePdf}
      disabled={generating}
      className="gap-2"
    >
      {generating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Télécharger PDF
    </Button>
  );
}
