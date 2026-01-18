import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CGV_SHORT } from '@/lib/cgvContent';

interface BlPrintableProps {
  bl: {
    bl_id: string;
    date_livraison: string;
    volume_m3: number;
    formule_id: string;
    heure_depart_centrale?: string | null;
    heure_prevue?: string | null;
    toupie_assignee?: string | null;
    camion_assigne?: string | null;
    chauffeur_nom?: string | null;
    client?: { nom_client: string; adresse?: string | null } | null;
    formule?: { designation?: string } | null;
  };
  disabled?: boolean;
}

export function BlPrintable({ bl, disabled = false }: BlPrintableProps) {
  const [printing, setPrinting] = useState(false);

  const printBL = async () => {
    setPrinting(true);

    try {
      const heureDepart = bl.heure_depart_centrale || bl.heure_prevue || '--:--';
      const camion = bl.camion_assigne || bl.toupie_assignee || 'Non assigné';
      const chauffeur = bl.chauffeur_nom || 'Non assigné';

      // Clean B&W A4 format for plant printing
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>BL ${bl.bl_id}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              color: #000;
              line-height: 1.4;
              font-size: 12pt;
            }
            .container { 
              max-width: 100%; 
              padding: 0;
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
              font-size: 28pt;
              font-weight: bold;
              letter-spacing: 2px;
            }
            .logo-sub {
              font-size: 10pt;
              margin-top: 5px;
            }
            .bl-box {
              text-align: right;
              border: 2px solid #000;
              padding: 15px 20px;
            }
            .bl-number {
              font-size: 18pt;
              font-weight: bold;
            }
            .bl-date {
              font-size: 12pt;
              margin-top: 5px;
            }
            .section {
              margin-bottom: 20px;
              border: 1px solid #000;
              padding: 15px;
            }
            .section-title {
              font-size: 11pt;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 1px solid #000;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
            }
            .info-label {
              font-size: 9pt;
              text-transform: uppercase;
              color: #333;
            }
            .info-value {
              font-size: 14pt;
              font-weight: bold;
              margin-top: 3px;
            }
            .product-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .product-table th,
            .product-table td {
              border: 1px solid #000;
              padding: 10px;
              text-align: left;
            }
            .product-table th {
              background: #f0f0f0;
              font-size: 10pt;
              text-transform: uppercase;
            }
            .product-table td {
              font-size: 12pt;
            }
            .volume-highlight {
              font-size: 24pt;
              font-weight: bold;
              text-align: center;
            }
            .signature-section {
              margin-top: 30px;
              border: 2px solid #000;
              padding: 20px;
            }
            .signature-title {
              font-size: 12pt;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 15px;
              text-align: center;
            }
            .signature-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
            }
            .signature-box {
              border: 1px dashed #666;
              height: 80px;
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
              padding: 10px;
            }
            .signature-label {
              font-size: 9pt;
              text-align: center;
              border-top: 1px solid #000;
              padding-top: 5px;
            }
            .cgv-section {
              margin-top: 20px;
              padding: 12px 15px;
              border: 1px solid #ddd;
              background: #fafafa;
              font-size: 7pt;
              color: #888;
              line-height: 1.4;
            }
            .cgv-title {
              font-size: 8pt;
              font-weight: bold;
              margin-bottom: 8px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .cgv-rules {
              list-style-type: decimal;
              padding-left: 18px;
              margin: 0;
            }
            .cgv-rules li {
              margin-bottom: 2px;
            }
            .cgv-rules li strong {
              color: #666;
            }
            .cgv-footer {
              margin-top: 10px;
              font-style: italic;
              text-align: center;
              font-size: 7pt;
              color: #999;
            }
            .footer {
              margin-top: 15px;
              text-align: center;
              font-size: 8pt;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <div class="logo">TALMI BETON</div>
                <div class="logo-sub">Béton Prêt à l'Emploi - Excellence & Qualité</div>
              </div>
              <div class="bl-box">
                <div class="bl-number">${bl.bl_id}</div>
                <div class="bl-date">${new Date(bl.date_livraison).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Informations Client</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Client</span>
                  <span class="info-value">${bl.client?.nom_client || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Chantier / Adresse</span>
                  <span class="info-value">${bl.client?.adresse || 'Adresse client'}</span>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Détails Produit</div>
              <table class="product-table">
                <thead>
                  <tr>
                    <th style="width: 40%;">Formule</th>
                    <th style="width: 30%;">Désignation</th>
                    <th style="width: 30%;">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>${bl.formule_id}</strong></td>
                    <td>${bl.formule?.designation || 'Béton Standard'}</td>
                    <td class="volume-highlight">${bl.volume_m3} m³</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="section-title">Logistique</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Camion</span>
                  <span class="info-value">${camion}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Chauffeur</span>
                  <span class="info-value">${chauffeur}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Heure de Départ</span>
                  <span class="info-value">${heureDepart}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Heure d'Arrivée Estimée</span>
                  <span class="info-value">_________</span>
                </div>
              </div>
            </div>

            <div class="signature-section">
              <div class="signature-title">Réception & Signatures</div>
              <div class="signature-grid">
                <div>
                  <div class="signature-box"></div>
                  <div class="signature-label">Signature du Chauffeur</div>
                </div>
                <div>
                  <div class="signature-box"></div>
                  <div class="signature-label">Signature du Client (Cachet)</div>
                </div>
              </div>
              <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 10pt;">
                <div>
                  <span style="color: #666;">Heure réelle d'arrivée:</span> ________________
                </div>
                <div>
                  <span style="color: #666;">Observations:</span> ________________
                </div>
              </div>
            </div>

            <div class="cgv-section">
              <div class="cgv-title">Conditions de Livraison (Extrait des CGV)</div>
              <ol class="cgv-rules">
                <li><strong>Validité :</strong> Ce Bon de Livraison est soumis aux CGV de Talmi Beton.</li>
                <li><strong>Accès :</strong> Le client garantit un accès sécurisé et dégagé au point de déchargement.</li>
                <li><strong>Attente :</strong> Le temps de déchargement est limité à 30 minutes. Tout dépassement sera facturé.</li>
                <li><strong>Qualité :</strong> La conformité du béton est garantie jusqu'à la goulotte du camion.</li>
                <li><strong>Eau :</strong> Toute adjonction d'eau sur site annule la garantie de résistance du béton.</li>
                <li><strong>Paiement :</strong> Le paiement est dû selon les termes convenus. Des pénalités s'appliquent en cas de retard (Loi 32-10).</li>
                <li><strong>Litiges :</strong> Les tribunaux de Casablanca sont seuls compétents.</li>
              </ol>
              <p class="cgv-footer">*La signature du client atteste de la réception du volume et de l'acceptation des conditions ci-dessus.*</p>
            </div>

            <div class="footer">
              <strong>TALMI BETON SARL</strong> | Zone Industrielle - Casablanca | Tél: +212 5XX XXX XXX | RC: XXXXXX | ICE: XXXXXXXXXXXXXXX
            </div>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
        toast.success('Bon de Livraison prêt à imprimer');
      } else {
        toast.error('Impossible d\'ouvrir la fenêtre d\'impression');
      }
    } catch (error) {
      console.error('Error printing BL:', error);
      toast.error('Erreur lors de l\'impression');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={printBL}
      disabled={disabled || printing}
      className="gap-2 min-h-[44px] min-w-[44px]"
    >
      {printing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Imprimer BL</span>
    </Button>
  );
}
