import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableTableHead } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
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
  MoreVertical,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ClientHoverPreview } from '@/components/ventes/ClientHoverPreview';
import { FacturePdfGenerator } from '@/components/documents/FacturePdfGenerator';
import { FacturePdfProGenerator } from '@/components/documents/FacturePdfProGenerator';
import { FactureDetailDialog } from '@/components/ventes/FactureDetailDialog';
import { PartialPaymentDialog } from '@/components/finance/PartialPaymentDialog';
import { useI18n } from '@/i18n/I18nContext';
import { DollarSign } from 'lucide-react';
import { getDateLocale } from '@/i18n/dateLocale';
import { TableSkeletonRows, TableEmptyState, TableFilteredEmpty, TableErrorState } from '@/components/ui/TableStates';

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
  const { t, lang } = useI18n();
  const ft = t.facturesTable;
  const c = t.common;
  const dateLocale = getDateLocale(lang);

  const FACTURE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    emise: { label: ft.statusEmise, color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
    envoyee: { label: ft.statusEnvoyee, color: 'bg-primary/10 text-primary border-primary/30', icon: <FileText className="h-3 w-3" /> },
    payee: { label: ft.statusPayee, color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
    retard: { label: ft.statusRetard, color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <AlertCircle className="h-3 w-3" /> },
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 50) return "text-emerald-400 bg-emerald-400/10";
    if (margin >= 30) return "text-amber-400 bg-amber-400/10";
    return "text-red-400 bg-red-400/10";
  };

  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentFacture, setPaymentFacture] = useState<Facture | null>(null);
  const [partialPayments, setPartialPayments] = useState<Record<string, any[]>>({});

  const fetchPartialPayments = useCallback(async (factureIds: string[]) => {
    if (factureIds.length === 0) return;
    const { data } = await supabase
      .from('paiements_partiels')
      .select('*')
      .in('facture_id', factureIds)
      .order('date_paiement', { ascending: true });
    
    const grouped: Record<string, any[]> = {};
    data?.forEach(p => {
      if (!grouped[p.facture_id]) grouped[p.facture_id] = [];
      grouped[p.facture_id].push(p);
    });
    setPartialPayments(grouped);
  }, []);

  const handleOpenDetail = (facture: Facture) => {
    setSelectedFacture(facture);
    setDetailDialogOpen(true);
    onViewDetail?.(facture);
  };

  const fetchFactures = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      // Fetch factures without joins since there's no direct FK relationship
      const { data: facturesData, error } = await supabase
        .from('factures')
        .select('*')
        .order('date_facture', { ascending: false });

      if (error) throw error;
      
      // ... keep existing code for client/formule enrichment
      // Fetch client names separately
      const clientIds = [...new Set((facturesData || []).map(f => f.client_id))];
      const { data: clientsData } = await supabase
        .from('clients')
        .select('client_id, nom_client')
        .in('client_id', clientIds);
      
      const clientMap = new Map((clientsData || []).map(c => [c.client_id, c.nom_client]));

      // Fetch formule designations
      const formuleIds = [...new Set((facturesData || []).map(f => f.formule_id))];
      const { data: formulesData } = await supabase
        .from('formules_theoriques')
        .select('formule_id, designation')
        .in('formule_id', formuleIds);
      
      const formuleMap = new Map((formulesData || []).map(f => [f.formule_id, f.designation]));

      // Fallback: if client_name is missing, try to get from BL
      const missingClientFactures = (facturesData || []).filter(f => !clientMap.has(f.client_id));
      const fallbackClientNames: Record<string, string> = {};
      
      if (missingClientFactures.length > 0) {
        const blIds = missingClientFactures.map(f => f.bl_id);
        const { data: blData } = await supabase
          .from('bons_livraison_reels')
          .select('bl_id, client_id')
          .in('bl_id', blIds);
        
        if (blData) {
          const blClientIds = [...new Set(blData.map(b => b.client_id))];
          const { data: blClients } = await supabase
            .from('clients')
            .select('client_id, nom_client')
            .in('client_id', blClientIds);
          
          const blClientMap = new Map((blClients || []).map(c => [c.client_id, c.nom_client]));
          for (const bl of blData) {
            const name = blClientMap.get(bl.client_id);
            if (name) fallbackClientNames[bl.bl_id] = name;
          }
        }
      }

      const enrichedFactures: Facture[] = (facturesData || []).map(f => ({
        ...f,
        client_name: clientMap.get(f.client_id) || fallbackClientNames[f.facture_id] || undefined,
        formule_designation: formuleMap.get(f.formule_id) || undefined,
      }));

      setFactures(enrichedFactures);
    } catch (error) {
      console.error('Error fetching factures:', error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFactures().then(() => {
      // Fetch partial payments after factures are loaded
    });
  }, [fetchFactures]);

  useEffect(() => {
    if (factures.length > 0) {
      fetchPartialPayments(factures.map(f => f.facture_id));
    }
  }, [factures, fetchPartialPayments]);

  const filteredFactures = useMemo(() => factures.filter(f => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.facture_id.toLowerCase().includes(term) ||
      f.client_name?.toLowerCase().includes(term) ||
      f.bl_id.toLowerCase().includes(term) ||
      f.bc_id?.toLowerCase().includes(term)
    );
  }).map(f => ({
    ...f,
    _date: f.date_facture || '',
    _total_ht: f.total_ht ?? 0,
    _statut: f.statut || '',
  })), [factures, searchTerm]);

  const { sortedData: sortedFactures, sortKey, sortDirection, handleSort } = useTableSort(filteredFactures, '_date', 'desc');

  const FACT_PAGE_SIZE = 25;
  const [factPage, setFactPage] = useState(1);
  useMemo(() => { setFactPage(1); }, [filteredFactures.length]);
  const paginatedFactures = sortedFactures.slice((factPage - 1) * FACT_PAGE_SIZE, factPage * FACT_PAGE_SIZE);

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

  const COL_COUNT = onSelectionChange ? 11 : 10;

  if (loading) {
    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>N° Facture</TableHead>
              <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>Client</TableHead>
              <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>BL/BC</TableHead>
              <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>Date</TableHead>
              <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>Vol.</TableHead>
              <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>Total HT</TableHead>
              <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>TTC</TableHead>
              <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>Marge</TableHead>
              <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>Statut</TableHead>
              <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeletonRows columns={10} />
          </TableBody>
        </Table>
      </div>
    );
  }

  if (fetchError) {
    return (
      <Table>
        <TableBody>
          <TableErrorState columns={COL_COUNT} onRetry={fetchFactures} />
        </TableBody>
      </Table>
    );
  }

  return (
    <>
    <div className="space-y-4">
      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={ft.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center text-sm">
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#9CA3AF', fontSize: 13 }}>
            {filteredFactures.length} {ft.invoices}
          </span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#22C55E', border: '1px solid #22C55E', borderRadius: 100, padding: '2px 10px', background: 'transparent' }}>
            {paidCount} {ft.paid}
          </span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#F59E0B', border: '1px solid #F59E0B', borderRadius: 100, padding: '2px 10px', background: 'transparent' }}>
            {pendingCount} {ft.pending}
          </span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: '#D4A843', fontSize: 14 }}>
            {Number(totalHT).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH HT
          </span>
        </div>
      </div>

      {filteredFactures.length === 0 ? (
        <Table>
          <TableBody>
            {factures.length === 0 ? (
              <TableEmptyState
                columns={COL_COUNT}
                icon={Receipt}
                title={ft.noInvoiceFound}
                description={ft.invoicesAppearAfterDelivery}
              />
            ) : (
              <TableFilteredEmpty columns={COL_COUNT} onClearFilters={() => setSearchTerm('')} />
            )}
          </TableBody>
        </Table>
      ) : (
        <>
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectionChange && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label={ft.selectAll}
                    className={cn(someSelected && "data-[state=checked]:bg-primary/50")}
                  />
                </TableHead>
              )}
              <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{ft.invoiceNumber}</TableHead>
              <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{c.client}</TableHead>
              <TableHead style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{ft.blBc}</TableHead>
              <SortableTableHead label={c.date} sortKey="_date" currentKey={sortKey} direction={sortDirection} onSort={handleSort} align="center" />
              <TableHead className="text-right" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{c.volume} (m³)</TableHead>
              <SortableTableHead label={`${c.totalHT} (DH)`} sortKey="_total_ht" currentKey={sortKey} direction={sortDirection} onSort={handleSort} align="right" />
              <TableHead className="text-right" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{ft.totalTtc || 'Total TTC'} (DH)</TableHead>
              <TableHead className="text-center" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{ft.margin}</TableHead>
              <SortableTableHead label={c.status} sortKey="_statut" currentKey={sortKey} direction={sortDirection} onSort={handleSort} align="center" />
              <TableHead className="text-center" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' }}>{ft.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFactures.map((facture) => {
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
                    "cursor-pointer",
                    isSelected && "bg-primary/5"
                  )}
                  style={{ transition: 'background 200ms' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(212,168,67,0.03)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = ''; }}
                  onClick={() => handleOpenDetail(facture)}
                >
                  {onSelectionChange && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOne(facture.id, !!checked)}
                        aria-label={`${ft.select} ${facture.facture_id}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        style={{ fontFamily: 'ui-monospace, monospace', color: '#D4A843', fontWeight: 500, fontSize: 12, cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                      >{facture.facture_id}</span>
                      {isConsolidated && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-[10px] px-1">
                              {facture.bls_inclus?.length} BL
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {ft.consolidatedInvoice} {facture.bls_inclus?.length} {ft.deliveries}
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
                      <span style={{ fontFamily: 'ui-monospace, monospace', color: 'rgba(212,168,67,0.7)', fontWeight: 400, fontSize: 12 }}>{facture.bl_id}</span>
                      {facture.bc_id && (
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#9CA3AF' }}>{facture.bc_id}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-center" style={{ fontFamily: 'ui-monospace, monospace' }}>
                    {format(parseISO(facture.date_facture), 'dd/MM/yyyy', { locale: dateLocale || undefined })}
                  </TableCell>
                  <TableCell className="text-right" style={{ fontFamily: 'ui-monospace, monospace' }}>{facture.volume_m3}</TableCell>
                  <TableCell className="text-right">
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 300, color: 'white' }}>
                      {Number(facture.total_ht).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 300, color: '#9CA3AF' }}>
                      {Number(facture.total_ttc).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {facture.marge_brute_pct !== null ? (
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-mono"
                        style={(() => {
                          const m = parseFloat(String(facture.marge_brute_pct));
                          if (m >= 50) return { color: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)' };
                          if (m >= 30) return { color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.1)' };
                          return { color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' };
                        })()}
                      >
                        {facture.marge_brute_pct.toFixed(1)}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {facture.statut === 'payee' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #22C55E', color: '#22C55E', background: 'rgba(34,197,94,0.08)', fontFamily: 'ui-monospace, monospace', fontSize: 11, borderRadius: 100, padding: '2px 10px' }}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #F59E0B', color: '#F59E0B', background: 'rgba(245,158,11,0.08)', fontFamily: 'ui-monospace, monospace', fontSize: 11, borderRadius: 100, padding: '2px 10px' }}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/30 hover:text-white/60">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[160px]">
                        <DropdownMenuItem
                          className="gap-2 text-[13px] cursor-pointer"
                          onClick={() => {
                            setSelectedFacture(facture);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Voir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-[13px] cursor-pointer"
                          onClick={() => {/* PDF gen handled by existing generator */}}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-[13px] cursor-pointer"
                          onClick={() => {
                            setPaymentFacture(facture);
                            setPaymentDialogOpen(true);
                          }}
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          Paiement
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-[13px] cursor-pointer"
                          onClick={() => {
                            window.open(`/factures/${facture.facture_id}`, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ouvrir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          currentPage={factPage}
          totalItems={sortedFactures.length}
          pageSize={FACT_PAGE_SIZE}
          onPageChange={setFactPage}
        />
        </>
      )}
    </div>

      {/* Facture Detail Dialog */}
      <FactureDetailDialog
        facture={selectedFacture}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Partial Payment Dialog */}
      {paymentFacture && (
        <PartialPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          factureId={paymentFacture.facture_id}
          totalTTC={paymentFacture.total_ttc}
          existingPayments={partialPayments[paymentFacture.facture_id] || []}
          onSuccess={() => {
            fetchFactures();
            fetchPartialPayments(factures.map(f => f.facture_id));
          }}
        />
      )}
    </>
  );
}
