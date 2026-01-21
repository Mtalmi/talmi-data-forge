import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import { Devis, BonCommande } from '@/hooks/useSalesWorkflow';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExportReportsDialogProps {
  devisList: Devis[];
  bcList: BonCommande[];
  selectedDevisIds: string[];
  selectedBcIds: string[];
}

type ExportFormat = 'csv' | 'json';
type ExportScope = 'all' | 'selected' | 'filtered';

export function ExportReportsDialog({
  devisList,
  bcList,
  selectedDevisIds,
  selectedBcIds,
}: ExportReportsDialogProps) {
  const [open, setOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exportScope, setExportScope] = useState<ExportScope>('all');
  const [includeDevis, setIncludeDevis] = useState(true);
  const [includeBc, setIncludeBc] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const hasSelectedItems = selectedDevisIds.length > 0 || selectedBcIds.length > 0;

  const getExportData = () => {
    let exportDevis = devisList;
    let exportBc = bcList;

    if (exportScope === 'selected') {
      exportDevis = devisList.filter(d => selectedDevisIds.includes(d.id));
      exportBc = bcList.filter(bc => selectedBcIds.includes(bc.id));
    }

    return { exportDevis, exportBc };
  };

  const generateCSV = () => {
    const { exportDevis, exportBc } = getExportData();
    const lines: string[] = [];
    const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });

    // Summary section
    if (includeSummary) {
      lines.push('=== RAPPORT COMMERCIAL ===');
      lines.push(`Date d'export: ${dateStr}`);
      lines.push('');
      
      if (includeDevis) {
        const totalDevisHT = exportDevis.reduce((sum, d) => sum + d.total_ht, 0);
        const totalDevisVolume = exportDevis.reduce((sum, d) => sum + d.volume_m3, 0);
        lines.push('--- Résumé Devis ---');
        lines.push(`Total Devis: ${exportDevis.length}`);
        lines.push(`En Attente: ${exportDevis.filter(d => d.statut === 'en_attente').length}`);
        lines.push(`Convertis: ${exportDevis.filter(d => d.statut === 'converti').length}`);
        lines.push(`Refusés: ${exportDevis.filter(d => d.statut === 'refuse').length}`);
        lines.push(`Total HT: ${totalDevisHT.toLocaleString()} DH`);
        lines.push(`Volume Total: ${totalDevisVolume.toFixed(2)} m³`);
        lines.push('');
      }

      if (includeBc) {
        const totalBcHT = exportBc.reduce((sum, bc) => sum + bc.total_ht, 0);
        const totalBcVolume = exportBc.reduce((sum, bc) => sum + bc.volume_m3, 0);
        lines.push('--- Résumé Bons de Commande ---');
        lines.push(`Total BC: ${exportBc.length}`);
        lines.push(`Prêt Production: ${exportBc.filter(bc => bc.statut === 'pret_production').length}`);
        lines.push(`En Production: ${exportBc.filter(bc => bc.statut === 'en_production').length}`);
        lines.push(`Livrés: ${exportBc.filter(bc => bc.statut === 'livre' || bc.statut === 'termine').length}`);
        lines.push(`Total HT: ${totalBcHT.toLocaleString()} DH`);
        lines.push(`Volume Total: ${totalBcVolume.toFixed(2)} m³`);
        lines.push('');
      }
    }

    // Devis data
    if (includeDevis && exportDevis.length > 0) {
      lines.push('=== DEVIS ===');
      lines.push(['N° Devis', 'Client', 'Formule', 'Volume (m³)', 'Prix/m³ (DH)', 'Total HT (DH)', 'Marge (%)', 'Statut', 'Date Création', 'Date Expiration'].join(';'));
      
      exportDevis.forEach(d => {
        lines.push([
          d.devis_id,
          d.client?.nom_client || '',
          d.formule_id,
          d.volume_m3.toString(),
          d.prix_vente_m3.toString(),
          d.total_ht.toString(),
          d.margin_pct.toString(),
          d.statut,
          format(new Date(d.created_at), 'dd/MM/yyyy'),
          d.date_expiration ? format(new Date(d.date_expiration), 'dd/MM/yyyy') : '',
        ].join(';'));
      });
      lines.push('');
    }

    // BC data
    if (includeBc && exportBc.length > 0) {
      lines.push('=== BONS DE COMMANDE ===');
      lines.push(['N° BC', 'Client', 'Formule', 'Volume (m³)', 'Prix/m³ (DH)', 'Total HT (DH)', 'Date Livraison', 'Statut', 'Mode Paiement', 'Date Création'].join(';'));
      
      exportBc.forEach(bc => {
        lines.push([
          bc.bc_id,
          bc.client?.nom_client || '',
          bc.formule_id,
          bc.volume_m3.toString(),
          bc.prix_vente_m3.toString(),
          bc.total_ht.toString(),
          bc.date_livraison_souhaitee ? format(new Date(bc.date_livraison_souhaitee), 'dd/MM/yyyy') : '',
          bc.statut,
          bc.mode_paiement || '',
          format(new Date(bc.created_at), 'dd/MM/yyyy'),
        ].join(';'));
      });
    }

    return lines.join('\n');
  };

  const generateJSON = () => {
    const { exportDevis, exportBc } = getExportData();
    
    const data: Record<string, unknown> = {
      exportDate: new Date().toISOString(),
      exportedBy: 'Ventes Module',
    };

    if (includeSummary) {
      data.summary = {
        devis: includeDevis ? {
          total: exportDevis.length,
          enAttente: exportDevis.filter(d => d.statut === 'en_attente').length,
          convertis: exportDevis.filter(d => d.statut === 'converti').length,
          refuses: exportDevis.filter(d => d.statut === 'refuse').length,
          totalHT: exportDevis.reduce((sum, d) => sum + d.total_ht, 0),
          totalVolume: exportDevis.reduce((sum, d) => sum + d.volume_m3, 0),
        } : null,
        bonsCommande: includeBc ? {
          total: exportBc.length,
          pretProduction: exportBc.filter(bc => bc.statut === 'pret_production').length,
          enProduction: exportBc.filter(bc => bc.statut === 'en_production').length,
          livres: exportBc.filter(bc => bc.statut === 'livre' || bc.statut === 'termine').length,
          totalHT: exportBc.reduce((sum, bc) => sum + bc.total_ht, 0),
          totalVolume: exportBc.reduce((sum, bc) => sum + bc.volume_m3, 0),
        } : null,
      };
    }

    if (includeDevis) {
      data.devis = exportDevis.map(d => ({
        id: d.devis_id,
        client: d.client?.nom_client || null,
        formule: d.formule_id,
        volume: d.volume_m3,
        prixM3: d.prix_vente_m3,
        totalHT: d.total_ht,
        marge: d.margin_pct,
        statut: d.statut,
        dateCreation: d.created_at,
        dateExpiration: d.date_expiration,
      }));
    }

    if (includeBc) {
      data.bonsCommande = exportBc.map(bc => ({
        id: bc.bc_id,
        client: bc.client?.nom_client || null,
        formule: bc.formule_id,
        volume: bc.volume_m3,
        prixM3: bc.prix_vente_m3,
        totalHT: bc.total_ht,
        dateLivraison: bc.date_livraison_souhaitee,
        statut: bc.statut,
        modePaiement: bc.mode_paiement,
        dateCreation: bc.created_at,
      }));
    }

    return JSON.stringify(data, null, 2);
  };

  const handleExport = () => {
    setIsExporting(true);

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      const dateStr = format(new Date(), 'yyyyMMdd_HHmm');

      if (exportFormat === 'csv') {
        content = generateCSV();
        filename = `rapport_commercial_${dateStr}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
      } else {
        content = generateJSON();
        filename = `rapport_commercial_${dateStr}.json`;
        mimeType = 'application/json;charset=utf-8;';
      }

      // Download file
      const blob = new Blob(['\ufeff' + content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Rapport exporté: ${filename}`);
      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export des Données
          </DialogTitle>
          <DialogDescription>
            Exportez vos devis et bons de commande avec statistiques
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Format</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(v) => setExportFormat(v as ExportFormat)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-1 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Excel)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-1 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  JSON
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Scope Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Périmètre</Label>
            <RadioGroup
              value={exportScope}
              onValueChange={(v) => setExportScope(v as ExportScope)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">
                  Toutes les données ({devisList.length} devis, {bcList.length} BC)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="selected" disabled={!hasSelectedItems} />
                <Label htmlFor="selected" className="cursor-pointer flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Sélection uniquement
                  {hasSelectedItems && (
                    <Badge variant="secondary">
                      {selectedDevisIds.length + selectedBcIds.length} éléments
                    </Badge>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Content Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Contenu</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDevis"
                  checked={includeDevis}
                  onCheckedChange={(c) => setIncludeDevis(!!c)}
                />
                <Label htmlFor="includeDevis" className="cursor-pointer">
                  Devis
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeBc"
                  checked={includeBc}
                  onCheckedChange={(c) => setIncludeBc(!!c)}
                />
                <Label htmlFor="includeBc" className="cursor-pointer">
                  Bons de Commande
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSummary"
                  checked={includeSummary}
                  onCheckedChange={(c) => setIncludeSummary(!!c)}
                />
                <Label htmlFor="includeSummary" className="cursor-pointer">
                  Inclure les statistiques
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || (!includeDevis && !includeBc)}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
