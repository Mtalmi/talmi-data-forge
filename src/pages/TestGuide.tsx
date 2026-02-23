import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';

export default function TestGuide() {
  const generatePDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    const margin = 16;
    const maxW = w - margin * 2;
    let y = 18;

    const addPage = () => { doc.addPage(); y = 18; };
    const checkPage = (need: number) => { if (y + need > 275) addPage(); };

    // Title
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, w, 40, 'F');
    doc.setFillColor(234, 179, 8);
    doc.rect(margin, 34, 50, 3, 'F');
    doc.setTextColor(234, 179, 8);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('TBOS', margin, 18);
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('Guide de Test Mobile', margin, 28);
    y = 50;
    doc.setTextColor(60, 60, 60);

    const heading = (text: string) => {
      checkPage(16);
      doc.setFillColor(234, 179, 8);
      doc.rect(margin - 2, y - 5, 4, 10, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(text, margin + 6, y + 2);
      y += 12;
    };

    const body = (text: string) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(text, maxW - 6);
      checkPage(lines.length * 5 + 4);
      doc.text(lines, margin + 6, y);
      y += lines.length * 5 + 3;
    };

    const step = (num: string, text: string) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(234, 179, 8);
      checkPage(8);
      doc.text(num, margin + 6, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(text, maxW - 18);
      doc.text(lines, margin + 14, y);
      y += lines.length * 5 + 2;
    };

    const check = (text: string) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(34, 139, 34);
      checkPage(7);
      doc.text('✓ ' + text, margin + 10, y);
      y += 6;
      doc.setTextColor(60, 60, 60);
    };

    const gap = (n = 6) => { y += n; };

    // ─── ÉTAPE 1 ───
    heading('Étape 1 : Connexion');
    step('1.', "Ouvre le lien de l'app sur Safari ou Chrome");
    step('2.', 'Email : max.talmi@gmail.com');
    step('3.', 'Mot de passe : MaxTbos2026!');
    step('4.', 'Appuie sur "Se connecter"');
    check('Tu dois arriver sur le Dashboard avec les KPIs');
    gap();

    // ─── ÉTAPE 2 ───
    heading('Étape 2 : Explorer le Dashboard');
    step('1.', 'Vérifie que les cartes KPI s\'affichent correctement');
    step('2.', 'Scroll vers le bas — les graphiques doivent se charger');
    step('3.', 'Teste le changement de langue (drapeau en haut à droite) : FR → AR → EN');
    check('Tout le texte doit changer dans la langue choisie');
    gap();

    // ─── ÉTAPE 3 ───
    heading('Étape 3 : Créer un Devis');
    step('1.', 'En bas, appuie sur "Plus (...)" puis "Ventes"');
    step('2.', 'Appuie sur "+ Nouveau Devis"');
    step('3.', 'Remplis : Client, Formule, Volume (ex: 50), Prix/m³ (ex: 850)');
    step('4.', 'Appuie sur "Créer"');
    check('Le devis apparaît avec le statut "Brouillon"');
    gap();

    // ─── ÉTAPE 4 ───
    heading('Étape 4 : Validation en 2 Étapes');
    step('1.', 'Appuie sur le devis créé');
    step('2.', 'Essaie "Valider Administratif" — doit être grisé/verrouillé 🔒');
    step('3.', 'Appuie sur "Validation Technique" → approuve');
    step('4.', '"Valider Administratif" se débloque — appuie dessus');
    check('Statut passe à "Approuvé", champs en lecture seule');
    gap();

    // ─── ÉTAPE 5 ───
    heading('Étape 5 : Convertir Devis → Bon de Commande');
    step('1.', 'Sur un devis approuvé, appuie sur "Convertir en BC"');
    step('2.', 'Vérifie les infos pré-remplies');
    step('3.', 'Confirme la conversion');
    check('Un nouveau BC apparaît dans l\'onglet BC');
    gap();

    // ─── ÉTAPE 6 ───
    heading('Étape 6 : Navigation entre modules');
    body('Teste chaque onglet du menu en bas :');
    step('•', 'Accueil : KPIs et graphiques visibles');
    step('•', 'Planning : Calendrier lisible');
    step('•', 'Logistique : Liste des livraisons');
    step('•', 'Plus → Production : Lots de production');
    step('•', 'Plus → Stocks : Niveaux de stock');
    step('•', 'Plus → Clients : Liste clients');
    gap();

    // ─── ÉTAPE 7 ───
    heading('Étape 7 : Checklist rapide');
    const checks = [
      'Scroll : tout scrolle naturellement',
      'Formulaires : le clavier ne cache pas les boutons',
      'Tableaux : glissement horizontal si large',
      'Boutons : assez grands pour le pouce',
      'Popups/Modals : s\'ouvrent et se ferment',
      'Texte : pas de texte coupé ou qui déborde',
    ];
    checks.forEach(c => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      checkPage(7);
      doc.text('☐  ' + c, margin + 6, y);
      y += 6;
    });
    gap();

    // ─── BONUS ───
    heading('Bonus : Installer l\'app');
    step('•', 'iPhone : Partager → "Sur l\'écran d\'accueil"');
    step('•', 'Android : Menu navigateur → "Installer l\'application"');
    check('L\'app s\'ouvre comme une vraie app mobile !');

    // Footer
    gap(10);
    doc.setDrawColor(234, 179, 8);
    doc.line(margin, y, w - margin, y);
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('TBOS — Talmi Beton Operating System • Guide de test généré le ' + new Date().toLocaleDateString('fr-FR'), margin, y);

    doc.save('TBOS_Guide_Test_Mobile.pdf');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
          <span className="text-2xl font-bold text-primary-foreground">TB</span>
        </div>
        <h1 className="text-2xl font-bold">Guide de Test Mobile</h1>
        <p className="text-muted-foreground text-sm">
          Télécharge le guide PDF pour tester TBOS sur téléphone étape par étape.
        </p>
        <Button onClick={generatePDF} size="lg" className="gap-2 w-full">
          <Download className="h-5 w-5" />
          Télécharger le PDF
        </Button>
        <a href="/auth" className="text-xs text-muted-foreground underline block">
          ← Retour à la connexion
        </a>
      </div>
    </div>
  );
}
