import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { getCGVContent, CGV_STYLES } from '@/lib/cgvContent';

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

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

export default function DevisPdfGenerator({ devis }: DevisPdfGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [useFullCGV, setUseFullCGV] = useState(devis.volume_m3 >= 500);

  const generatePdf = async () => {
    setGenerating(true);

    try {
      const cgvContent = getCGVContent(devis.volume_m3, useFullCGV);
      const today = new Date().toLocaleDateString('fr-FR');
      const expDate = devis.date_expiration
        ? new Date(devis.date_expiration).toLocaleDateString('fr-FR')
        : null;

      const tvaAmount = devis.total_ht * 0.2;
      const totalTtc = devis.total_ht * 1.2;
      const transportTotal = devis.transport_extra_per_m3 * devis.volume_m3;
      const hasTransport = devis.distance_km > 20 && transportTotal > 0;

      const pdfContent = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <title>Devis ${devis.devis_id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
              padding: 35px 40px;
              color: #1f2937;
              line-height: 1.55;
              font-size: 13px;
              background: #fff;
            }

            /* ── HEADER ── */
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 10px;
            }
            .logo-block {}
            .logo-name {
              font-size: 26px;
              font-weight: 800;
              color: #111827;
              letter-spacing: -0.5px;
            }
            .logo-tagline {
              font-size: 11px;
              color: #6b7280;
              margin-top: 2px;
            }
            .doc-block {
              text-align: right;
            }
            .doc-type {
              font-size: 22px;
              font-weight: 700;
              color: #D4A843;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .doc-ref {
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-top: 4px;
            }
            .doc-meta {
              font-size: 11px;
              color: #6b7280;
              margin-top: 2px;
            }
            .gold-line {
              border: none;
              border-top: 2.5px solid #D4A843;
              margin: 14px 0 28px 0;
            }

            /* ── PARTIES (Émetteur + Client) ── */
            .parties {
              display: flex;
              gap: 24px;
              margin-bottom: 28px;
            }
            .party-card {
              flex: 1;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px 18px;
            }
            .party-label {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #D4A843;
              margin-bottom: 10px;
            }
            .party-name {
              font-size: 15px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 4px;
            }
            .party-detail {
              font-size: 11.5px;
              color: #4b5563;
              line-height: 1.65;
            }
            .party-ids {
              margin-top: 8px;
              font-size: 10px;
              color: #6b7280;
            }
            .party-field-label {
              font-size: 10px;
              color: #9ca3af;
              margin-top: 8px;
            }
            .party-field-line {
              border-bottom: 1px dashed #d1d5db;
              height: 18px;
              margin-top: 2px;
            }

            /* ── TABLE ── */
            .table-section { margin-bottom: 0; }
            .section-title {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #D4A843;
              margin-bottom: 12px;
            }
            table.details {
              width: 100%;
              border-collapse: collapse;
            }
            table.details th {
              background: #f9fafb;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #6b7280;
              padding: 10px 12px;
              border-bottom: 2px solid #e5e7eb;
            }
            table.details td {
              padding: 11px 12px;
              border-bottom: 1px solid #f3f4f6;
              font-size: 13px;
              vertical-align: top;
            }
            table.details tr:nth-child(even) td {
              background: #fafafa;
            }
            .col-desc { width: 40%; }
            .col-qty { width: 15%; text-align: center; }
            .col-unit { width: 22%; text-align: right; }
            .col-amount { width: 23%; text-align: right; }
            .desc-main { font-weight: 600; color: #111827; }
            .desc-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
            .mono { font-family: 'Courier New', 'Menlo', monospace; }

            /* ── TOTALS ── */
            .totals-wrapper {
              display: flex;
              justify-content: flex-end;
              margin-top: 0;
            }
            .totals-table {
              width: 320px;
              border-collapse: collapse;
            }
            .totals-table td {
              padding: 8px 14px;
              font-size: 13px;
            }
            .totals-table .label { text-align: right; color: #4b5563; }
            .totals-table .value { text-align: right; font-family: 'Courier New', monospace; font-weight: 600; }
            .row-ht {
              background: rgba(212, 168, 67, 0.12);
            }
            .row-ht .label, .row-ht .value { color: #92710A; font-weight: 600; }
            .row-tva td { border-bottom: 1px solid #e5e7eb; }
            .row-ttc {
              background: #D4A843;
            }
            .row-ttc td {
              padding: 12px 14px;
              color: #fff;
              font-weight: 800;
              font-size: 16px;
            }

            /* ── PAYMENT CONDITIONS ── */
            .conditions-card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 18px 20px;
              margin: 28px 0;
              background: #f9fafb;
            }
            .conditions-card .section-title { margin-bottom: 10px; }
            .cond-row {
              display: flex;
              align-items: flex-start;
              gap: 8px;
              margin-bottom: 6px;
              font-size: 12px;
              color: #374151;
              line-height: 1.5;
            }
            .cond-icon { flex-shrink: 0; width: 18px; text-align: center; }
            .cond-label { font-weight: 600; min-width: 85px; }
            .bank-details {
              margin-top: 8px;
              padding: 10px 14px;
              background: #fff;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              font-size: 11.5px;
              color: #4b5563;
              line-height: 1.7;
            }
            .bank-details strong { color: #111827; }

            /* ── SIGNATURE BLOCK ── */
            .signature-block {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px 24px;
              margin: 28px 0;
            }
            .sig-title {
              font-size: 14px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 4px;
            }
            .sig-desc {
              font-size: 11px;
              color: #6b7280;
              margin-bottom: 18px;
              line-height: 1.55;
            }
            .sig-columns {
              display: flex;
              gap: 40px;
            }
            .sig-col {
              flex: 1;
              border: 1px dashed #d1d5db;
              border-radius: 6px;
              padding: 14px 16px;
              min-height: 120px;
            }
            .sig-col-title {
              font-size: 11px;
              font-weight: 700;
              color: #374151;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .sig-field {
              font-size: 11px;
              color: #6b7280;
              margin-bottom: 4px;
            }
            .sig-line {
              border-bottom: 1px solid #9ca3af;
              margin-top: 30px;
              width: 80%;
            }
            .sig-name {
              font-size: 11px;
              font-weight: 600;
              color: #374151;
              margin-top: 6px;
            }
            .sig-role {
              font-size: 10px;
              color: #6b7280;
            }

            /* ── FOOTER ── */
            .page-footer {
              margin-top: 32px;
              border-top: 1.5px solid #D4A843;
              padding-top: 12px;
              text-align: center;
              font-size: 10px;
              color: #9ca3af;
              line-height: 1.7;
            }
            .page-footer strong { color: #6b7280; }
            .page-number {
              margin-top: 6px;
              font-size: 9px;
              color: #d1d5db;
            }

            ${CGV_STYLES}

            @media print {
              body { padding: 20mm; background: white; }
              .no-print { display: none; }
              .quote-page { max-width: 210mm; margin: 0 auto; }
            }
          </style>
        </head>
        <body>
          <div class="quote-page">

            <!-- ═══ HEADER ═══ -->
            <div class="header">
              <div class="logo-block">
                <div class="logo-name">TALMI BETON</div>
                <div class="logo-tagline">Excellence en Béton Prêt à l'Emploi</div>
              </div>
              <div class="doc-block">
                <div class="doc-type">Devis</div>
                <div class="doc-ref">N° ${devis.devis_id}</div>
                <div class="doc-meta">Date : ${today}</div>
                ${expDate ? `<div class="doc-meta">Validité : ${expDate}</div>` : ''}
              </div>
            </div>
            <hr class="gold-line" />

            <!-- ═══ ÉMETTEUR / CLIENT ═══ -->
            <div class="parties">
              <div class="party-card">
                <div class="party-label">Émetteur</div>
                <div class="party-name">Talmi Beton SARL</div>
                <div class="party-detail">
                  Zone Industrielle, Lot 47<br>
                  Casablanca, Maroc<br>
                  +212 522 345 678<br>
                  contact@talmibeton.ma
                </div>
                <div class="party-ids">
                  RC : 387421 &nbsp;|&nbsp; IF : 24567890 &nbsp;|&nbsp; ICE : 002456789000045
                </div>
              </div>
              <div class="party-card">
                <div class="party-label">Client</div>
                <div class="party-name">${devis.client?.nom_client || 'Client non spécifié'}</div>
                <div class="party-detail">
                  ${devis.client?.adresse || ''}
                </div>
                <div class="party-field-label">Réf. client</div>
                <div class="party-field-line"></div>
                <div class="party-field-label">Chantier</div>
                <div class="party-field-line"></div>
              </div>
            </div>

            <!-- ═══ DETAILS TABLE ═══ -->
            <div class="table-section">
              <div class="section-title">Détails du Devis</div>
              <table class="details">
                <thead>
                  <tr>
                    <th class="col-desc">Description</th>
                    <th class="col-qty">Quantité</th>
                    <th class="col-unit">Prix Unitaire</th>
                    <th class="col-amount">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="col-desc">
                      <div class="desc-main">${devis.formule_id}</div>
                      <div class="desc-sub">${devis.formule?.designation || 'Béton prêt à l\'emploi'}</div>
                    </td>
                    <td class="col-qty mono">${devis.volume_m3} m³</td>
                    <td class="col-unit mono">${fmt(devis.prix_vente_m3)} DH/m³</td>
                    <td class="col-amount mono">${fmt(devis.total_ht)} DH</td>
                  </tr>
                  ${hasTransport ? `
                  <tr>
                    <td class="col-desc">
                      <div class="desc-main">Transport supplémentaire</div>
                      <div class="desc-sub">Distance : ${devis.distance_km} km (${devis.distance_km - 20} km au-delà de 20 km)</div>
                    </td>
                    <td class="col-qty mono">${devis.volume_m3} m³</td>
                    <td class="col-unit mono">${fmt(devis.transport_extra_per_m3)} DH/m³</td>
                    <td class="col-amount mono">${fmt(transportTotal)} DH</td>
                  </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>

            <!-- ═══ TOTALS ═══ -->
            <div class="totals-wrapper">
              <table class="totals-table">
                <tr class="row-ht">
                  <td class="label">TOTAL HT</td>
                  <td class="value mono">${fmt(devis.total_ht + (hasTransport ? transportTotal : 0))} DH</td>
                </tr>
                <tr class="row-tva">
                  <td class="label">TVA (20%)</td>
                  <td class="value mono">${fmt(tvaAmount)} DH</td>
                </tr>
                <tr class="row-ttc">
                  <td class="label" style="color:#fff;">TOTAL TTC</td>
                  <td class="value mono" style="color:#fff;">${fmt(totalTtc)} DH</td>
                </tr>
              </table>
            </div>

            <!-- ═══ CONDITIONS DE PAIEMENT ═══ -->
            <div class="conditions-card">
              <div class="section-title">Conditions de Paiement</div>
              <div class="cond-row">
                <span class="cond-icon">💳</span>
                <span class="cond-label">Mode :</span>
                <span>Virement Bancaire</span>
              </div>
              <div class="cond-row">
                <span class="cond-icon">📅</span>
                <span class="cond-label">Échéance :</span>
                <span>30 jours fin de mois</span>
              </div>
              <div class="cond-row">
                <span class="cond-icon">📋</span>
                <span class="cond-label">Validité :</span>
                <span>30 jours à compter de la date d'émission</span>
              </div>
              <div class="cond-row">
                <span class="cond-icon">📞</span>
                <span class="cond-label">Contact :</span>
                <span>Karim El Fassi — +212 661 234 567</span>
              </div>
              <div class="bank-details">
                <strong>🏦 Coordonnées Bancaires</strong><br>
                RIB : 007 780 0001234567890123 76<br>
                Banque : Attijariwafa Bank — Agence Casablanca Centre<br>
                IBAN : MA76 0077 8000 0123 4567 8901 2376
              </div>
            </div>

            <!-- ═══ BON POUR ACCORD ═══ -->
            <div class="signature-block">
              <div class="sig-title">Bon pour Accord</div>
              <div class="sig-desc">
                En signant ce document, le client accepte les conditions générales de vente ci-dessous
                et s'engage à respecter les termes du présent devis.
              </div>
              <div class="sig-columns">
                <div class="sig-col">
                  <div class="sig-col-title">Le Client</div>
                  <div class="sig-field">Date : __ / __ / ____</div>
                  <div class="sig-field" style="margin-top: 14px;">Signature et cachet :</div>
                  <div class="sig-line"></div>
                </div>
                <div class="sig-col">
                  <div class="sig-col-title">Talmi Beton SARL</div>
                  <div class="sig-field">Date : ${today}</div>
                  <div class="sig-field" style="margin-top: 14px;">Signature :</div>
                  <div class="sig-line"></div>
                  <div class="sig-name">Karim El Fassi</div>
                  <div class="sig-role">Directeur Commercial</div>
                </div>
              </div>
            </div>

            <!-- ═══ CGV ═══ -->
            ${cgvContent}

            <!-- ═══ PAGE FOOTER ═══ -->
            <div class="page-footer">
              <strong>TALMI BETON SARL</strong> &nbsp;|&nbsp; RC : 387421 &nbsp;|&nbsp; IF : 24567890 &nbsp;|&nbsp; ICE : 002456789000045<br>
              Zone Industrielle, Lot 47, Casablanca &nbsp;|&nbsp; +212 522 345 678 &nbsp;|&nbsp; contact@talmibeton.ma
              <div class="page-number">Page 1/1</div>
            </div>

          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
          printWindow.print();
        }, 500);

        toast.success('PDF prêt pour impression/téléchargement');
      } else {
        toast.error("Impossible d'ouvrir la fenêtre d'impression");
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Switch
          id="cgv-toggle"
          checked={useFullCGV}
          onCheckedChange={setUseFullCGV}
          className="data-[state=checked]:bg-primary"
        />
        <Label htmlFor="cgv-toggle" className="text-xs text-muted-foreground cursor-pointer">
          CGV Complètes
        </Label>
      </div>
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
    </div>
  );
}
