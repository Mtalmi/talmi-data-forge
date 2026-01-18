import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface FacturePdfGeneratorProps {
  facture: {
    facture_id: string;
    bl_id: string;
    volume_m3: number;
    prix_vente_m3: number;
    total_ht: number;
    tva_pct: number;
    total_ttc: number;
    cur_reel: number | null;
    marge_brute_pct: number | null;
    date_emission: string;
    client?: { nom_client: string; adresse: string | null; telephone: string | null } | null;
    formule?: { designation: string } | null;
    formule_id?: string;
  };
}

export function FacturePdfGenerator({ facture }: FacturePdfGeneratorProps) {
  const [generating, setGenerating] = useState(false);

  const generatePdf = async () => {
    setGenerating(true);

    try {
      const tvaAmount = facture.total_ht * (facture.tva_pct / 100);

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Facture ${facture.facture_id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #16a34a; padding-bottom: 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #16a34a; }
            .logo-sub { font-size: 12px; color: #666; }
            .facture-badge { background: #16a34a; color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 18px; }
            .facture-id { font-size: 20px; font-weight: bold; margin-top: 10px; }
            .date { font-size: 12px; color: #666; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 14px; font-weight: bold; color: #16a34a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .client-info { background: #f9fafb; padding: 15px; border-radius: 8px; }
            .client-name { font-size: 16px; font-weight: bold; }
            .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            .table th { background: #f3f4f6; font-weight: 600; font-size: 12px; text-transform: uppercase; }
            .table .number { text-align: right; font-family: 'Courier New', monospace; }
            .total-row { background: #dcfce7; font-weight: bold; }
            .total-row td { font-size: 16px; border-bottom: 2px solid #16a34a; }
            .price-highlight { font-size: 24px; color: #16a34a; font-weight: bold; }
            .payment-info { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin-top: 30px; }
            .payment-title { font-weight: bold; color: #b45309; margin-bottom: 10px; }
            .bank-details { background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 15px; font-family: 'Courier New', monospace; font-size: 12px; }
            .cgv { margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px; font-size: 11px; color: #666; page-break-before: always; }
            .cgv-title { font-weight: bold; margin-bottom: 10px; color: #333; font-size: 14px; }
            .cgv-list { list-style: disc; padding-left: 20px; }
            .cgv-list li { margin-bottom: 8px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            @media print { body { padding: 20px; } .cgv { page-break-before: always; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">TALMI BETON</div>
              <div class="logo-sub">Excellence en Béton Prêt à l'Emploi</div>
            </div>
            <div style="text-align: right;">
              <div class="facture-badge">FACTURE</div>
              <div class="facture-id">${facture.facture_id}</div>
              <div class="date">Date: ${new Date(facture.date_emission).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Facturé à</div>
            <div class="client-info">
              <div class="client-name">${facture.client?.nom_client || 'Client'}</div>
              ${facture.client?.adresse ? `<div>${facture.client.adresse}</div>` : ''}
              ${facture.client?.telephone ? `<div>Tél: ${facture.client.telephone}</div>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Détails de la Facture</div>
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
                    <strong>Béton Prêt à l'Emploi</strong><br>
                    <span style="color: #666; font-size: 12px;">${facture.formule?.designation || facture.formule_id || ''}</span><br>
                    <span style="color: #666; font-size: 12px;">Réf. BL: ${facture.bl_id}</span>
                  </td>
                  <td>${facture.volume_m3} m³</td>
                  <td class="number">${facture.prix_vente_m3.toLocaleString('fr-FR')} DH/m³</td>
                  <td class="number">${facture.total_ht.toLocaleString('fr-FR')} DH</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3"><strong>Total HT</strong></td>
                  <td class="number" style="font-weight: bold;">${facture.total_ht.toLocaleString('fr-FR')} DH</td>
                </tr>
                <tr>
                  <td colspan="3">TVA (${facture.tva_pct}%)</td>
                  <td class="number">${tvaAmount.toLocaleString('fr-FR')} DH</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3"><strong>TOTAL TTC À PAYER</strong></td>
                  <td class="number price-highlight">${facture.total_ttc.toLocaleString('fr-FR')} DH</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="payment-info">
            <div class="payment-title">💳 INFORMATIONS DE PAIEMENT</div>
            <p>Veuillez effectuer le paiement selon les modalités convenues.</p>
            <div class="bank-details">
              <strong>Coordonnées bancaires:</strong><br>
              Banque: XXXXXXXXXX<br>
              RIB: XXXX XXXX XXXX XXXX XXXX XX<br>
              IBAN: MAXX XXXX XXXX XXXX XXXX XXXX XXX
            </div>
          </div>

          <div class="cgv">
            <div class="cgv-title">CONDITIONS GÉNÉRALES DE VENTE</div>
            <ul class="cgv-list">
              <li><strong>Livraison:</strong> Livraison gratuite dans un rayon de 20 km. Au-delà, supplément de 5 DH/m³/km.</li>
              <li><strong>Délai de paiement:</strong> 30 jours fin de mois, sauf conditions particulières négociées.</li>
              <li><strong>Pénalités de retard:</strong> En cas de retard de paiement, des pénalités de 1.5% par mois seront appliquées conformément à la loi 32-10.</li>
              <li><strong>Quantité minimale:</strong> Commande minimum de 2 m³ par livraison.</li>
              <li><strong>Temps d'attente:</strong> Au-delà de 30 minutes sur chantier, facturation de 100 DH/15 minutes.</li>
              <li><strong>Annulation:</strong> Toute commande annulée moins de 24h avant la livraison sera facturée à 50%.</li>
              <li><strong>Conformité:</strong> Le béton est livré conforme aux normes NM 10.1.008.</li>
              <li><strong>Responsabilité:</strong> TALMI BETON n'est pas responsable de l'utilisation du béton après livraison.</li>
              <li><strong>Réclamations:</strong> Toute réclamation doit être formulée par écrit dans les 48 heures suivant la livraison.</li>
              <li><strong>Juridiction:</strong> En cas de litige, seuls les tribunaux de Casablanca sont compétents.</li>
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

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
        toast.success('Facture PDF prête');
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
    <Button variant="outline" size="sm" onClick={generatePdf} disabled={generating} className="gap-2">
      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      Télécharger PDF
    </Button>
  );
}
