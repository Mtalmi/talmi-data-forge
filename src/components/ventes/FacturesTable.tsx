import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Receipt,
  Loader2,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ClientHoverPreview } from '@/components/ventes/ClientHoverPreview';
import { FacturePdfGenerator } from '@/components/documents/FacturePdfGenerator';

interface Facture {
  id: string;
  facture_id: string;
  bl_id: string;
  bc_id: string | null;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  prix_vente_m3: number;
  total_ht: number;
  total_ttc: number;
  tva_pct: number;
  marge_brute_pct: number | null;
  marge_brute_dh: number | null;
  cur_reel: number | null;
  statut: string;
  mode_paiement: string | null;
  is_consolidee: boolean | null;
  bls_inclus: string[] | null;
  date_facture: string;
  created_at: string;
  // Joined data
  client_name?: string;
  formule_designation?: string;
}

const FACTURE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  emise: { label: 'Émise', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
  envoyee: { label: 'Envoyée', color: 'bg-primary/10 text-primary border-primary/30', icon: <FileText className="h-3 w-3" /> },
  payee: { label: 'Payée', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  retard: { label: 'En Retard', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <AlertCircle className="h-3 w-3" /> },
};

interface FacturesTableProps {
  onViewDetail?: (facture: Facture) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function FacturesTable({ 
  onViewDetail, 
  selectedIds = [], 
  onSelectionChange 
}: FacturesTableProps) {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFactures = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch factures without joins since there's no direct FK relationship
      const { data: facturesData, error: facturesError } = await supabase
        .from('factures')
        .select('*')
        .order('created_at', { ascending: false });

      if (facturesError) throw facturesError;

      // Fetch client names for the factures
      const clientIds = [...new Set((facturesData || []).map(f => f.client_id))];
      const { data: clientsData } = await supabase
        .from('clients')
        .select('client_id, nom_client')
        .in('client_id', clientIds);

      // Fetch formule designations
      const formuleIds = [...new Set((facturesData || []).map(f => f.formule_id))];
      const { data: formulesData } = await supabase
        .from('formules_theoriques')
        .select('formule_id, designation')
        .in('formule_id', formuleIds);

      // Map clients and formules to factures
      const clientMap = new Map(clientsData?.map(c => [c.client_id, c.nom_client]) || []);
      const formuleMap = new Map(formulesData?.map(f => [f.formule_id, f.designation]) || []);

      const enrichedFactures: Facture[] = (facturesData || []).map(f => ({
        ...f,
        client_name: clientMap.get(f.client_id) || undefined,
        formule_designation: formuleMap.get(f.formule_id) || undefined,
      }));

      setFactures(enrichedFactures);
    } catch (error) {
      console.error('Error fetching factures:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFactures();
  }, [fetchFactures]);

  const filteredFactures = factures.filter(f => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.facture_id.toLowerCase().includes(term) ||
      f.client_name?.toLowerCase().includes(term) ||
      f.bl_id.toLowerCase().includes(term) ||
      f.bc_id?.toLowerCase().includes(term)
    );
  });

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(filteredFactures.map(f => f.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(i => i !== id));
    }
  };

  const allSelected = filteredFactures.length > 0 && selectedIds.length === filteredFactures.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < filteredFactures.length;

  // Stats summary
  const totalHT = filteredFactures.reduce((sum, f) => sum + f.total_ht, 0);
  const paidCount = filteredFactures.filter(f => f.statut === 'payee').length;
  const pendingCount = filteredFactures.filter(f => f.statut !== 'payee').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher facture, client, BL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="outline" className="gap-1">
            <Receipt className="h-3 w-3" />
            {filteredFactures.length} factures
          </Badge>
          <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/30">
            <CheckCircle className="h-3 w-3" />
            {paidCount} payées
          </Badge>
          <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/30">
            <Clock className="h-3 w-3" />
            {pendingCount} en attente
          </Badge>
          <Badge variant="secondary" className="font-mono">
            {totalHT.toLocaleString()} DH HT
          </Badge>
        </div>
      </div>

      {filteredFactures.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Aucune facture trouvée</p>
          <p className="text-sm text-muted-foreground mt-1">
            Les factures apparaissent ici après la livraison des commandes
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectionChange && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Tout sélectionner"
                    className={cn(someSelected && "data-[state=checked]:bg-primary/50")}
                  />
                </TableHead>
              )}
              <TableHead>N° Facture</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>BL / BC</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="text-right">Total HT</TableHead>
              <TableHead className="text-right">Total TTC</TableHead>
              <TableHead>Marge</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFactures.map((facture) => {
              const statusConfig = FACTURE_STATUS_CONFIG[facture.statut] || FACTURE_STATUS_CONFIG.emise;
              const isSelected = selectedIds.includes(facture.id);
              const isConsolidated = facture.is_consolidee && facture.bls_inclus && facture.bls_inclus.length > 1;

              // Map to the expected FacturePdfGenerator format
              const pdfFacture = {
                facture_id: facture.facture_id,
                bl_id: facture.bl_id,
                volume_m3: facture.volume_m3,
                prix_vente_m3: facture.prix_vente_m3,
                total_ht: facture.total_ht,
                tva_pct: facture.tva_pct,
                total_ttc: facture.total_ttc,
                cur_reel: facture.cur_reel,
                marge_brute_pct: facture.marge_brute_pct,
                date_emission: facture.date_facture,
                client: facture.client_name ? { nom_client: facture.client_name, adresse: null, telephone: null } : undefined,
                formule: facture.formule_designation ? { designation: facture.formule_designation } : undefined,
                formule_id: facture.formule_id,
              };

              return (
                <TableRow
                  key={facture.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => onViewDetail?.(facture)}
                >
                  {onSelectionChange && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOne(facture.id, !!checked)}
                        aria-label={`Sélectionner ${facture.facture_id}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{facture.facture_id}</span>
                      {isConsolidated && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-[10px] px-1">
                              {facture.bls_inclus?.length} BL
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            Facture consolidée regroupant {facture.bls_inclus?.length} livraisons
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {facture.client_name ? (
                      <ClientHoverPreview clientId={facture.client_id} clientName={facture.client_name} />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-mono">{facture.bl_id}</span>
                      {facture.bc_id && (
                        <span className="text-[10px] text-muted-foreground">{facture.bc_id}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(parseISO(facture.date_facture), 'dd/MM/yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right font-mono">{facture.volume_m3} m³</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {facture.total_ht.toLocaleString()} DH
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {facture.total_ttc.toLocaleString()} DH
                  </TableCell>
                  <TableCell>
                    {facture.marge_brute_pct !== null ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono",
                          facture.marge_brute_pct >= 25 && "bg-success/10 text-success border-success/30",
                          facture.marge_brute_pct >= 15 && facture.marge_brute_pct < 25 && "bg-warning/10 text-warning border-warning/30",
                          facture.marge_brute_pct < 15 && "bg-destructive/10 text-destructive border-destructive/30"
                        )}
                      >
                        {facture.marge_brute_pct.toFixed(1)}%
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <FacturePdfGenerator facture={pdfFacture} compact />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Voir détails</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
