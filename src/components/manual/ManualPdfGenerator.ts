import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale'; // PDF always in French

interface ManualSection {
  title: string;
  content: string[];
}

const GOLDEN_RULES: ManualSection[] = [
  {
    title: '1. PHOTO FIRST (La Photo Avant Tout)',
    content: [
      'Aucune réception de stock ou dépense ne peut être validée sans preuve photographique.',
      '• Photographiez le bon de livraison ou la facture',
      '• Capturez les détails lisibles (date, montant, fournisseur)',
      '• Le système vérifie automatiquement les données par IA',
      '• Les photos sont archivées dans le coffre-fort numérique',
    ],
  },
  {
    title: '2. JUSTIFY MIDNIGHT (Justifier les Heures Creuses)',
    content: [
      'Toute activité entre 18h00 et 06h00 doit être accompagnée d\'une justification écrite.',
      '• Les actions hors-heures sont signalées au CEO',
      '• Un champ de justification obligatoire apparaît',
      '• Les urgences légitimes sont acceptées avec raison',
      '• L\'historique complet est conservé pour audit',
    ],
  },
  {
    title: '3. NO DELETIONS (Zéro Suppression)',
    content: [
      'Les données critiques ne peuvent jamais être supprimées. Seul le CEO peut autoriser des corrections.',
      '• Les BL, factures et formules sont immuables',
      '• Les modifications sont versionnées et tracées',
      '• Le CEO peut autoriser des corrections avec code d\'urgence',
      '• La piste d\'audit complète est préservée',
    ],
  },
];

const WORKFLOWS: ManualSection[] = [
  {
    title: 'RÉCEPTION DE STOCK',
    content: [
      'Étape 1: Photographier le bon de livraison fournisseur avec le montant visible',
      'Étape 2: Sélectionner le type de matériau (ciment, sable, gravette, adjuvant)',
      'Étape 3: Entrer la quantité et le numéro de BL',
      'Étape 4: Vérifier que l\'IA a bien extrait les données',
      'Étape 5: Cliquer sur "Confirmer la Réception"',
      '',
      'IMPORTANT: Seul l\'Agent Administratif peut ajouter du stock.',
      'Les Centralistes n\'ont AUCUN accès manuel aux silos.',
    ],
  },
  {
    title: 'NOUVELLE DÉPENSE',
    content: [
      'Étape 1: Photographier la facture ou le reçu',
      'Étape 2: Sélectionner le département (Logistique, Maintenance, Admin)',
      'Étape 3: Entrer le montant et la catégorie',
      'Étape 4: Soumettre pour approbation',
      '',
      'NIVEAUX D\'APPROBATION:',
      '• L1 (< 500 DH): Auto-approuvé',
      '• L2 (500-2000 DH): Approbation Superviseur',
      '• L3 (> 2000 DH): Approbation CEO',
      '',
      'PLAFOND MENSUEL: 15,000 MAD maximum par département',
    ],
  },
  {
    title: 'PLANIFIER UNE LIVRAISON',
    content: [
      'Étape 1: Créer le Bon de Commande (BC) depuis la page Ventes',
      'Étape 2: Spécifier: client, formule, volume, zone de livraison',
      'Étape 3: Dans Planning, glisser le BC vers un créneau horaire',
      'Étape 4: Assigner une toupie disponible',
      'Étape 5: Le Resp. Technique valide le slump test avant départ',
      '',
      'Le client peut suivre sa livraison en temps réel via le lien de tracking.',
    ],
  },
];

const CEO_MODE: ManualSection[] = [
  {
    title: 'LE SANCTUM (Tableau de Bord CEO)',
    content: [
      'Le CEO a accès à une vue "God Mode" avec:',
      '• Profit en temps réel avec marge par formule',
      '• Alertes de sécurité et anomalies',
      '• Flux de trésorerie et prévisions',
      '• Suivi GPS de la flotte',
      '• Validation des dépenses L2/L3',
    ],
  },
  {
    title: 'CODES D\'URGENCE',
    content: [
      'Le CEO peut générer des codes d\'urgence pour:',
      '• Autoriser des corrections exceptionnelles',
      '• Débloquer des situations critiques',
      '• Approuver des dépenses hors-plafond',
      '',
      'Chaque code est à usage unique et tracé dans l\'audit.',
    ],
  },
  {
    title: 'ALERTES CRITIQUES',
    content: [
      '🚨 STOCK CRITIQUE: Niveau < 15%',
      '🚨 MARGE FAIBLE: < 15% sur une commande',
      '🚨 TRANSACTION NOCTURNE: Activité hors-heures',
      '🚨 ARRÊT NON PLANIFIÉ: Camion > 15 min hors zone',
      '🚨 VOL CARBURANT: Consommation anormale détectée',
    ],
  },
];

export function generateManualPdf(): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Helper function to add new page if needed
  const checkNewPage = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Title Page
  pdf.setFillColor(5, 5, 5);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Gold title
  pdf.setTextColor(245, 158, 11);
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MANUEL SYSTÈME', pageWidth / 2, 80, { align: 'center' });
  
  pdf.setFontSize(18);
  pdf.text('TBOS - Talmi Beton Operating System', pageWidth / 2, 95, { align: 'center' });
  
  pdf.setTextColor(156, 163, 175);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('The Imperial Decree', pageWidth / 2, 110, { align: 'center' });
  
  // Version
  pdf.setFontSize(10);
  pdf.text(`Version 1.0 - ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, pageWidth / 2, 130, { align: 'center' });
  
  // Golden Rules Section
  pdf.addPage();
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  y = margin;
  
  pdf.setTextColor(245, 158, 11);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LES 3 RÈGLES D\'OR', margin, y);
  y += 15;
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Ces règles sont OBLIGATOIRES et non négociables.', margin, y);
  y += 15;
  
  GOLDEN_RULES.forEach((rule) => {
    checkNewPage(50);
    
    // Rule title
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(rule.title, margin, y);
    y += 8;
    
    // Rule content
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    rule.content.forEach((line) => {
      checkNewPage(8);
      const lines = pdf.splitTextToSize(line, contentWidth);
      pdf.text(lines, margin, y);
      y += lines.length * 5;
    });
    
    y += 10;
  });
  
  // Workflows Section
  pdf.addPage();
  y = margin;
  
  pdf.setTextColor(245, 158, 11);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PROCÉDURES OPÉRATIONNELLES', margin, y);
  y += 15;
  
  WORKFLOWS.forEach((workflow) => {
    checkNewPage(60);
    
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(workflow.title, margin, y);
    y += 8;
    
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    workflow.content.forEach((line) => {
      checkNewPage(8);
      if (line === '') {
        y += 3;
      } else {
        const lines = pdf.splitTextToSize(line, contentWidth);
        pdf.text(lines, margin, y);
        y += lines.length * 5;
      }
    });
    
    y += 12;
  });
  
  // CEO Mode Section
  pdf.addPage();
  y = margin;
  
  pdf.setTextColor(245, 158, 11);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MODE CEO - GOD VIEW', margin, y);
  y += 15;
  
  CEO_MODE.forEach((section) => {
    checkNewPage(50);
    
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.title, margin, y);
    y += 8;
    
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    section.content.forEach((line) => {
      checkNewPage(8);
      if (line === '') {
        y += 3;
      } else {
        const lines = pdf.splitTextToSize(line, contentWidth);
        pdf.text(lines, margin, y);
        y += lines.length * 5;
      }
    });
    
    y += 12;
  });
  
  // Footer on last page
  pdf.setTextColor(156, 163, 175);
  pdf.setFontSize(8);
  pdf.text('TBOS - Talmi Beton Operating System - Document Confidentiel', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  pdf.save(`Manuel_Systeme_TBOS_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
