import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RolePermission {
  role: string;
  label: string;
  pages: string[];
  permissions: string[];
}

const ROLES: RolePermission[] = [
  {
    role: 'ceo',
    label: 'CEO (Max Talmi)',
    pages: ['Toutes les pages'],
    permissions: ['Accès complet', 'Override crédit', 'Gestion Prix/Formules', 'Audit Superviseur', 'Gestion Utilisateurs'],
  },
  {
    role: 'superviseur',
    label: 'Superviseur (Karim)',
    pages: ['Tableau de bord', 'Planning', 'Production', 'Ventes', 'Clients', 'Stocks', 'Rapports'],
    permissions: ['Accès complet audité', 'Toutes modifications tracées', 'Visible dans Audit Superviseur'],
  },
  {
    role: 'directeur_operations',
    label: 'Directeur Opérations (Imad)',
    pages: ['Tableau de bord', 'Planning (Lecture)', 'Production', 'Logistique', 'Stocks', 'Maintenance', 'Formules (Lecture)', 'Clients (Lecture)'],
    permissions: ['Lecture seule Planning', 'Gestion Logistique', 'Pas d\'accès Prix/Facturation'],
  },
  {
    role: 'agent_administratif',
    label: 'Agent Administratif',
    pages: ['Tableau de bord', 'Planning', 'Production', 'Bons', 'Clients', 'Dépenses'],
    permissions: ['Propriétaire Planning', 'Override crédit client', 'Dispatch & Production'],
  },
  {
    role: 'centraliste',
    label: 'Centraliste',
    pages: ['Production', 'Stocks', 'Maintenance'],
    permissions: ['Saisie consommation', 'Gestion stocks', 'Pas d\'accès prix'],
  },
  {
    role: 'responsable_technique',
    label: 'Responsable Technique',
    pages: ['Laboratoire', 'Formules (Lecture)'],
    permissions: ['Validation qualité', 'Tests laboratoire'],
  },
  {
    role: 'commercial',
    label: 'Commercial',
    pages: ['Ventes', 'Clients'],
    permissions: ['Création devis/BC', 'Gestion clients'],
  },
  {
    role: 'accounting',
    label: 'Comptabilité',
    pages: ['Paiements', 'Rapprochement', 'Dépenses', 'Journal'],
    permissions: ['Suivi paiements', 'Rapprochement bancaire'],
  },
  {
    role: 'chauffeur',
    label: 'Chauffeur',
    pages: ['Vue Chauffeur'],
    permissions: ['Rotation tracking', 'Signature livraison', 'Saisie KM/Carburant'],
  },
  {
    role: 'auditeur',
    label: 'Auditeur Externe',
    pages: ['Portail Audit Externe'],
    permissions: ['Audit bi-mensuel', 'Soumission immutable', 'Aucun accès données'],
  },
];

const KPI_DEFINITIONS = [
  { name: 'CUR (Coût Unitaire Réel)', formula: 'Σ(Consommation × Prix) / Volume', unit: 'DH/m³' },
  { name: 'CUT (Coût Unitaire Théorique)', formula: 'Formule × Prix Actuels', unit: 'DH/m³' },
  { name: 'Marge Brute %', formula: '(Prix Vente - CUR) / Prix Vente × 100', unit: '%' },
  { name: 'Ratio E/C', formula: 'Eau (L) / Ciment (kg)', unit: 'ratio' },
  { name: 'L/100km', formula: '(Litres / KM Parcourus) × 100', unit: 'L/100km' },
  { name: 'Compliance Score', formula: '30% Silos + 30% Caisse + 20% Docs + 20% KM', unit: '0-100' },
];

export function SystemManualPdf() {
  const [generating, setGenerating] = useState(false);

  const generateManualPdf = async () => {
    setGenerating(true);
    
    try {
      const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TBOS - Manuel Système</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; }
    .page { padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; color: #0066cc; margin-bottom: 5px; }
    .header p { color: #666; font-size: 14px; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 18px; color: #0066cc; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 15px; }
    .role-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 12px; }
    .role-card h3 { font-size: 14px; color: #333; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .role-card .badge { background: #0066cc; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
    .role-card ul { margin-left: 20px; font-size: 13px; color: #555; }
    .role-card li { margin-bottom: 3px; }
    .kpi-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .kpi-table th, .kpi-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    .kpi-table th { background: #0066cc; color: white; }
    .kpi-table tr:nth-child(even) { background: #f8f9fa; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px; }
    .traffic-light { display: inline-flex; gap: 5px; margin-top: 10px; }
    .traffic-light .dot { width: 16px; height: 16px; border-radius: 50%; }
    .dot.green { background: #22c55e; }
    .dot.yellow { background: #eab308; }
    .dot.red { background: #ef4444; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>🏭 TBOS - Manuel Système</h1>
      <p>Talmi Beton Operating System • Version Hawaii 1.0</p>
      <p>Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>

    <div class="section">
      <h2>📋 Matrice des Rôles & Permissions</h2>
      ${ROLES.map(role => `
        <div class="role-card">
          <h3>
            <span class="badge">${role.role.toUpperCase()}</span>
            ${role.label}
          </h3>
          <p><strong>Pages:</strong> ${role.pages.join(', ')}</p>
          <p><strong>Permissions:</strong></p>
          <ul>
            ${role.permissions.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>📊 Définitions KPI "Hawaii Dashboard"</h2>
      <table class="kpi-table">
        <thead>
          <tr>
            <th>KPI</th>
            <th>Formule</th>
            <th>Unité</th>
          </tr>
        </thead>
        <tbody>
          ${KPI_DEFINITIONS.map(kpi => `
            <tr>
              <td><strong>${kpi.name}</strong></td>
              <td><code>${kpi.formula}</code></td>
              <td>${kpi.unit}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>🚦 Système Traffic Light (Audit Health)</h2>
      <p>Le widget "Audit Health" utilise un système de feux tricolores:</p>
      <div class="traffic-light">
        <span class="dot green"></span> <strong>Vert:</strong> Variance &lt; 2% - Conforme
      </div><br>
      <div class="traffic-light">
        <span class="dot yellow"></span> <strong>Jaune:</strong> Variance 2-5% - Attention
      </div><br>
      <div class="traffic-light">
        <span class="dot red"></span> <strong>Rouge:</strong> Variance &gt; 5% - Critique
      </div>
      <p style="margin-top: 15px;"><strong>Catégories surveillées:</strong></p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li><strong>Stock Variance:</strong> Écart entre stock système et physique</li>
        <li><strong>Cash Gap:</strong> Écart caisse application vs comptage</li>
        <li><strong>BL Compliance:</strong> Documents présents et signés</li>
        <li><strong>KM Drift:</strong> Écart compteur système vs odomètre réel</li>
      </ul>
    </div>

    <div class="section">
      <h2>🔒 Sécurité & Immutabilité</h2>
      <ul style="margin-left: 20px;">
        <li><strong>Audit Lock:</strong> Une fois soumis, un audit externe ne peut plus être modifié (sauf par CEO)</li>
        <li><strong>Credit Gate:</strong> Production bloquée si client dépasse limite crédit (override CEO uniquement)</li>
        <li><strong>Stock Lock:</strong> Déduction automatique par trigger SQL - pas de manipulation manuelle</li>
        <li><strong>Supervisor Audit:</strong> Toutes modifications par Superviseur sont loggées et visibles par CEO</li>
      </ul>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Talmi Beton • Document confidentiel • Usage interne uniquement</p>
    </div>
  </div>
</body>
</html>
      `;

      // Create blob and trigger download
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      toast.success('Manuel système généré - Utilisez Ctrl+P pour sauvegarder en PDF');
    } catch (error) {
      console.error('Error generating manual:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={generateManualPdf}
      disabled={generating}
      className="gap-2"
    >
      {generating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      Manuel Système
    </Button>
  );
}
