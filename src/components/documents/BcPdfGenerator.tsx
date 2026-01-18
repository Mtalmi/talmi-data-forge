import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { getCGVContent, CGV_STYLES } from '@/lib/cgvContent';

interface BcPdfGeneratorProps {
  bc: {
    bc_id: string;
    devis_id: string | null;
    formule_id: string;
    volume_m3: number;
    prix_vente_m3: number;
    total_ht: number;
    date_livraison_souhaitee: string | null;
    adresse_livraison: string | null;
    client?: { nom_client: string; adresse: string | null; telephone: string | null } | null;
    formule?: { designation: string } | null;
  };
  compact?: boolean;
}

export function BcPdfGenerator({ bc, compact = false }: BcPdfGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [useFullCGV, setUseFullCGV] = useState(bc.volume_m3 >= 500);

  const generatePdf = async () => {
    setGenerating(true);

    try {
      const cgvContent = getCGVContent(bc.volume_m3, useFullCGV);

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bon de Commande ${bc.bc_id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
            .logo-sub { font-size: 12px; color: #666; }
            .bc-badge { background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 18px; }
            .date { font-size: 12px; color: #666; margin-top: 10px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 14px; font-weight: bold; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .client-info, .delivery-info { background: #f9fafb; padding: 15px; border-radius: 8px; }
            .client-name { font-size: 16px; font-weight: bold; }
            .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            .table th { background: #f3f4f6; font-weight: 600; font-size: 12px; text-transform: uppercase; }
            .table .number { text-align: right; font-family: 'Courier New', monospace; }
            .total-row { background: #dbeafe; font-weight: bold; }
            .total-row td { font-size: 16px; border-bottom: 2px solid #2563eb; }
            .price-highlight { font-size: 24px; color: #2563eb; font-weight: bold; }
            .confirmation-box { background: #dcfce7; border: 2px solid #22c55e; padding: 20px; border-radius: 8px; margin-top: 30px; }
            .confirmation-title { font-weight: bold; color: #16a34a; margin-bottom: 10px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            ${CGV_STYLES}
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">TALMI BETON</div>
              <div class="logo-sub">Excellence en Béton Prêt à l'Emploi</div>
            </div>
            <div style="text-align: right;">
              <div class="bc-badge">BON DE COMMANDE</div>
              <div style="font-size: 16px; font-weight: bold; margin-top: 10px;">${bc.bc_id}</div>
              <div class="date">Date: ${new Date().toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Client</div>
            <div class="client-info">
              <div class="client-name">${bc.client?.nom_client || 'Client non spécifié'}</div>
              ${bc.client?.adresse ? `<div>${bc.client.adresse}</div>` : ''}
              ${bc.client?.telephone ? `<div>Tél: ${bc.client.telephone}</div>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Détails de la Livraison</div>
            <div class="delivery-info">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <span style="color: #666;">Date souhaitée:</span>
                  <strong>${bc.date_livraison_souhaitee ? new Date(bc.date_livraison_souhaitee).toLocaleDateString('fr-FR') : 'À confirmer'}</strong>
                </div>
                <div>
                  <span style="color: #666;">Adresse:</span>
                  <strong>${bc.adresse_livraison || 'Adresse du client'}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Commande</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Quantité</th>
                  <th>Prix Unitaire</th>
                  <th class="number">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>${bc.formule_id}</strong><br>
                    <span style="color: #666; font-size: 12px;">${bc.formule?.designation || ''}</span>
                  </td>
                  <td>${bc.volume_m3} m³</td>
                  <td class="number">${bc.prix_vente_m3.toLocaleString('fr-FR')} DH/m³</td>
                  <td class="number">${bc.total_ht.toLocaleString('fr-FR')} DH</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3"><strong>TOTAL HT</strong></td>
                  <td class="number price-highlight">${bc.total_ht.toLocaleString('fr-FR')} DH</td>
                </tr>
                <tr>
                  <td colspan="3">TVA (20%)</td>
                  <td class="number">${(bc.total_ht * 0.2).toLocaleString('fr-FR')} DH</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3"><strong>TOTAL TTC</strong></td>
                  <td class="number price-highlight">${(bc.total_ht * 1.2).toLocaleString('fr-FR')} DH</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="confirmation-box">
            <div class="confirmation-title">✓ COMMANDE CONFIRMÉE</div>
            <p>Ce bon de commande confirme votre réservation. Le prix est verrouillé et ne peut plus être modifié.</p>
            <p style="margin-top: 10px;"><strong>Référence Devis:</strong> ${bc.devis_id || 'N/A'}</p>
          </div>

          <div class="footer">
            <strong>TALMI BETON SARL</strong><br>
            Zone Industrielle - Casablanca | Tél: +212 5XX XXX XXX | Email: contact@talmibeton.ma<br>
            RC: XXXXXX | IF: XXXXXX | ICE: XXXXXXXXXXXXXXX
          </div>

          ${cgvContent}
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
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

  if (compact) {
    return (
      <Button variant="outline" size="sm" onClick={generatePdf} disabled={generating} className="gap-2">
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        PDF
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Switch 
          id="bc-cgv-toggle" 
          checked={useFullCGV} 
          onCheckedChange={setUseFullCGV}
          className="data-[state=checked]:bg-primary"
        />
        <Label htmlFor="bc-cgv-toggle" className="text-xs text-muted-foreground cursor-pointer">
          CGV Complètes
        </Label>
      </div>
      <Button variant="outline" size="sm" onClick={generatePdf} disabled={generating} className="gap-2">
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        Télécharger PDF
      </Button>
    </div>
  );
}
