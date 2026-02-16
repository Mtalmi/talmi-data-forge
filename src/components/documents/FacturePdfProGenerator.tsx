import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface FacturePdfProProps {
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
    client?: { nom_client: string; adresse: string | null; telephone: string | null; ice?: string | null } | null;
    formule?: { designation: string } | null;
    formule_id?: string;
    bls_inclus?: string[] | null;
    is_consolidee?: boolean | null;
  };
  compact?: boolean;
}

// Company info constants
const COMPANY = {
  name: 'TALMI BETON SARL',
  slogan: 'Excellence en Béton Prêt à l\'Emploi',
  address: 'Zone Industrielle, Lot 42 — Casablanca, Maroc',
  phone: '+212 5XX XXX XXX',
  email: 'contact@talmibeton.ma',
  rc: 'RC 123456',
  if_: 'IF 12345678',
  ice: '001234567890123',
  cnss: '1234567',
  patente: '12345678',
  rib: 'XXXX XXXX XXXX XXXX XXXX XX',
  bank: 'Attijariwafa Bank',
  iban: 'MA64 XXXX XXXX XXXX XXXX XXXX XXX',
};

function numberToWordsFR(n: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  if (n === 0) return 'zéro';
  if (n < 0) return 'moins ' + numberToWordsFR(-n);

  let result = '';
  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const remainder = Math.floor(n % 1000);

  if (millions > 0) {
    result += (millions === 1 ? 'un million' : numberToWordsFR(millions) + ' millions') + ' ';
  }
  if (thousands > 0) {
    result += (thousands === 1 ? 'mille' : numberToWordsFR(thousands) + ' mille') + ' ';
  }
  if (remainder > 0) {
    const hundreds = Math.floor(remainder / 100);
    const rest = remainder % 100;
    if (hundreds > 0) {
      result += (hundreds === 1 ? 'cent' : units[hundreds] + ' cent') + ' ';
    }
    if (rest > 0) {
      if (rest < 20) {
        result += units[rest];
      } else {
        const t = Math.floor(rest / 10);
        const u = rest % 10;
        if (t === 7 || t === 9) {
          result += tens[t] + '-' + units[10 + u];
        } else {
          result += tens[t] + (u ? '-' + units[u] : '');
        }
      }
    }
  }

  return result.trim();
}

function amountInWords(amount: number): string {
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  let text = numberToWordsFR(whole) + ' dirhams';
  if (cents > 0) {
    text += ' et ' + numberToWordsFR(cents) + ' centimes';
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function FacturePdfProGenerator({ facture, compact = false }: FacturePdfProProps) {
  const [generating, setGenerating] = useState(false);
  const [includeFullCGV, setIncludeFullCGV] = useState(facture.volume_m3 >= 500);

  const generatePdf = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210;
      const M = 15; // margin
      const PW = W - 2 * M; // page width
      let y = M;

      // Colors
      const green = [22, 163, 74]; // brand green
      const dark = [26, 26, 26];
      const gray = [100, 100, 100];
      const lightGray = [200, 200, 200];

      // ─── HEADER ───
      doc.setFillColor(green[0], green[1], green[2]);
      doc.rect(0, 0, W, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(COMPANY.name, M, 18);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(COMPANY.slogan, M, 26);

      // Facture badge
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(W - M - 55, 8, 55, 20, 3, 3, 'F');
      doc.setTextColor(green[0], green[1], green[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURE', W - M - 50, 18);
      doc.setFontSize(10);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text(facture.facture_id, W - M - 50, 24);

      y = 42;

      // ─── COMPANY & CLIENT INFO ───
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`${COMPANY.address}`, M, y);
      doc.text(`Tél: ${COMPANY.phone} | Email: ${COMPANY.email}`, M, y + 4);
      doc.text(`RC: ${COMPANY.rc} | IF: ${COMPANY.if_} | ICE: ${COMPANY.ice}`, M, y + 8);

      // Date on right
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.setFontSize(9);
      const dateStr = new Date(facture.date_emission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
      doc.text(`Date: ${dateStr}`, W - M, y, { align: 'right' });

      y += 16;

      // Client box
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(M, y, PW, 22, 2, 2, 'F');
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(M, y, PW, 22, 2, 2, 'S');

      doc.setTextColor(green[0], green[1], green[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURÉ À', M + 4, y + 5);

      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.setFontSize(11);
      doc.text(facture.client?.nom_client || 'Client', M + 4, y + 12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const clientDetails: string[] = [];
      if (facture.client?.adresse) clientDetails.push(facture.client.adresse);
      if (facture.client?.telephone) clientDetails.push(`Tél: ${facture.client.telephone}`);
      if (facture.client?.ice) clientDetails.push(`ICE: ${facture.client.ice}`);
      doc.text(clientDetails.join(' | '), M + 4, y + 17);

      // BL reference on right of client box
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFontSize(8);
      doc.text(`Réf. BL: ${facture.bl_id}`, W - M - 4, y + 12, { align: 'right' });
      if (facture.is_consolidee && facture.bls_inclus) {
        doc.text(`Consolidé: ${facture.bls_inclus.length} BL`, W - M - 4, y + 17, { align: 'right' });
      }

      y += 30;

      // ─── LINE ITEMS TABLE ───
      // Header
      doc.setFillColor(green[0], green[1], green[2]);
      doc.rect(M, y, PW, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('DÉSIGNATION', M + 3, y + 5.5);
      doc.text('QTÉ', M + 100, y + 5.5);
      doc.text('P.U. HT', M + 120, y + 5.5);
      doc.text('MONTANT HT', W - M - 3, y + 5.5, { align: 'right' });
      y += 8;

      // Row
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Béton Prêt à l'Emploi`, M + 3, y + 5);
      doc.setFontSize(7);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(facture.formule?.designation || facture.formule_id || '', M + 3, y + 9);

      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.setFontSize(9);
      doc.text(`${facture.volume_m3} m³`, M + 100, y + 5);
      doc.text(`${facture.prix_vente_m3.toLocaleString('fr-FR')} DH`, M + 120, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${facture.total_ht.toLocaleString('fr-FR')} DH`, W - M - 3, y + 5, { align: 'right' });

      y += 14;
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.line(M, y, W - M, y);
      y += 4;

      // ─── TOTALS ───
      const tvaAmount = facture.total_ht * (facture.tva_pct / 100);
      const totalsX = M + 100;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text('Total HT', totalsX, y + 4);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text(`${facture.total_ht.toLocaleString('fr-FR')} DH`, W - M - 3, y + 4, { align: 'right' });

      y += 7;
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(`TVA (${facture.tva_pct}%)`, totalsX, y + 4);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text(`${tvaAmount.toLocaleString('fr-FR')} DH`, W - M - 3, y + 4, { align: 'right' });

      y += 9;
      // TTC highlight
      doc.setFillColor(green[0], green[1], green[2]);
      doc.roundedRect(totalsX - 2, y, PW - totalsX + M + 2, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL TTC', totalsX + 2, y + 8);
      doc.setFontSize(12);
      doc.text(`${facture.total_ttc.toLocaleString('fr-FR')} DH`, W - M - 3, y + 8, { align: 'right' });

      y += 18;

      // ─── AMOUNT IN WORDS ───
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      const words = amountInWords(facture.total_ttc);
      doc.text(`Arrêté la présente facture à la somme de: ${words}`, M, y);

      y += 10;

      // ─── BANK DETAILS ───
      doc.setFillColor(255, 249, 235);
      doc.roundedRect(M, y, PW, 24, 2, 2, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.roundedRect(M, y, PW, 24, 2, 2, 'S');

      doc.setTextColor(180, 83, 9);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMATIONS DE PAIEMENT', M + 4, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text(`Banque: ${COMPANY.bank}`, M + 4, y + 11);
      doc.text(`RIB: ${COMPANY.rib}`, M + 4, y + 15);
      doc.text(`IBAN: ${COMPANY.iban}`, M + 4, y + 19);

      // Payment terms on right
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text('Délai: 30 jours fin de mois', W - M - 4, y + 11, { align: 'right' });
      doc.text('Pénalités: 1.5% / mois (Loi 32-10)', W - M - 4, y + 15, { align: 'right' });

      y += 30;

      // ─── LEGAL MENTIONS ───
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      const legalLines = [
        `${COMPANY.name} — Capital: 1.000.000 DH`,
        `${COMPANY.address}`,
        `RC: ${COMPANY.rc} | IF: ${COMPANY.if_} | ICE: ${COMPANY.ice} | CNSS: ${COMPANY.cnss} | Patente: ${COMPANY.patente}`,
        `Conformément aux dispositions de la loi 32-10, tout retard de paiement entraînera l'application de pénalités de retard.`,
        `En cas de litige, les tribunaux de Casablanca sont seuls compétents.`,
      ];
      legalLines.forEach((line, i) => {
        doc.text(line, W / 2, y + (i * 3.5), { align: 'center' });
      });

      // ─── CGV PAGE ───
      if (includeFullCGV) {
        doc.addPage();
        let cy = 20;
        doc.setTextColor(green[0], green[1], green[2]);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('CONDITIONS GÉNÉRALES DE VENTE', W / 2, cy, { align: 'center' });
        cy += 10;

        const articles = [
          { title: 'Article 1 - Commande', content: 'Toute commande implique l\'acceptation sans réserve des CGV. Commandes 24h minimum avant livraison. Annulation < 24h = 50% facturé. Minimum 2 m³/livraison.' },
          { title: 'Article 2 - Livraison', content: 'Livraison gratuite < 20km. Au-delà: +5 DH/m³/km. 30 min gratuites sur site, puis 100 DH/15 min. Le client garantit un accès sécurisé.' },
          { title: 'Article 3 - Qualité', content: 'Béton conforme NM 10.1.008. Responsabilité limitée à la goulotte. Toute adjonction d\'eau annule la garantie. Réclamations sous 48h par écrit.' },
          { title: 'Article 4 - Paiement', content: 'Paiement selon délais convenus. Pénalités: 1.5%/mois (Loi 32-10). Suspension possible si encours dépassé. Paiement par virement ou chèque certifié.' },
          { title: 'Article 5 - Juridiction', content: 'Droit marocain applicable. Compétence exclusive: tribunaux de Casablanca.' },
        ];

        articles.forEach(art => {
          doc.setTextColor(dark[0], dark[1], dark[2]);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(art.title, M, cy);
          cy += 5;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(gray[0], gray[1], gray[2]);
          const lines = doc.splitTextToSize(art.content, PW - 4);
          doc.text(lines, M + 2, cy);
          cy += lines.length * 3.5 + 4;
        });
      }

      // Save
      doc.save(`Facture_${facture.facture_id}_${new Date(facture.date_emission).toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF Pro généré avec succès');
    } catch (error) {
      console.error('Error generating PDF Pro:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setGenerating(false);
    }
  };

  if (compact) {
    return (
      <Button variant="outline" size="sm" onClick={generatePdf} disabled={generating} className="gap-2">
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        PDF Pro
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Switch id="pro-cgv-toggle" checked={includeFullCGV} onCheckedChange={setIncludeFullCGV} className="data-[state=checked]:bg-primary" />
        <Label htmlFor="pro-cgv-toggle" className="text-xs text-muted-foreground cursor-pointer">CGV Complètes</Label>
      </div>
      <Button onClick={generatePdf} disabled={generating} className="gap-2">
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        Télécharger PDF Pro
      </Button>
    </div>
  );
}
