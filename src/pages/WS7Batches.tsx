import { useState, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Search, Link2, Unlink, Clock, CheckCircle, AlertTriangle,
  Loader2, RefreshCw, Factory, ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type LinkFilter = 'all' | 'auto_linked' | 'pending' | 'no_match' | 'manual_linked';

const FILTER_OPTIONS: { value: LinkFilter; label: string; icon: typeof CheckCircle; color: string }[] = [
  { value: 'all', label: 'Tous', icon: Factory, color: 'text-foreground' },
  { value: 'auto_linked', label: 'Liés auto', icon: CheckCircle, color: 'text-success' },
  { value: 'manual_linked', label: 'Liés manuellement', icon: Link2, color: 'text-primary' },
  { value: 'pending', label: 'À réviser', icon: AlertTriangle, color: 'text-warning' },
  { value: 'no_match', label: 'Non liés', icon: Unlink, color: 'text-destructive' },
];

export default function WS7Batches() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialFilter = (searchParams.get('filter') as LinkFilter) || 'all';

  const [filter, setFilter] = useState<LinkFilter>(initialFilter);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [linkBlId, setLinkBlId] = useState('');
  const [linking, setLinking] = useState(false);
  const [relinking, setRelinking] = useState(false);

  const { data: batches, isLoading, refetch } = useQuery({
    queryKey: ['ws7-batches', filter],
    queryFn: async () => {
      let query = supabase
        .from('ws7_batches')
        .select('*')
        .order('batch_datetime', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('link_status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = (batches || []).filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.batch_number?.toLowerCase().includes(q) ||
      b.client_name?.toLowerCase().includes(q) ||
      b.formula?.toLowerCase().includes(q) ||
      b.operator_name?.toLowerCase().includes(q)
    );
  });

  const statusBadge = (status: string, confidence: number) => {
    switch (status) {
      case 'auto_linked':
        return <Badge className="bg-success/20 text-success border-0 gap-1"><CheckCircle className="h-3 w-3" />Auto-lié ({confidence}%)</Badge>;
      case 'manual_linked':
        return <Badge className="bg-primary/20 text-primary border-0 gap-1"><Link2 className="h-3 w-3" />Manuel</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-0 gap-1"><AlertTriangle className="h-3 w-3" />À réviser ({confidence}%)</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Unlink className="h-3 w-3" />Non lié</Badge>;
    }
  };

  const handleManualLink = async () => {
    if (!selectedBatch || !linkBlId.trim()) return;
    setLinking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ws7-link-batch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ batch_id: selectedBatch.id, bl_id: linkBlId.trim() }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({ title: 'Batch lié', description: `Lié au BL ${linkBlId}` });
      setDetailOpen(false);
      setLinkBlId('');
      refetch();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setLinking(false);
    }
  };

  const handleAutoRelink = async () => {
    if (!selectedBatch) return;
    setRelinking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ws7-auto-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ batch_id: selectedBatch.id }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      if (result.linked) {
        toast({ title: 'Auto-lié!', description: `Confiance: ${result.confidence}%` });
      } else {
        toast({ title: 'Aucun match trouvé', description: `Meilleure confiance: ${result.confidence}%`, variant: 'destructive' });
      }
      setDetailOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setRelinking(false);
    }
  };

  const openDetail = (batch: any) => {
    setSelectedBatch(batch);
    setLinkBlId(batch.linked_bl_id || '');
    setDetailOpen(true);
  };

  // Counts per status
  const counts = {
    all: batches?.length || 0,
    auto_linked: batches?.filter(b => b.link_status === 'auto_linked').length || 0,
    manual_linked: batches?.filter(b => b.link_status === 'manual_linked').length || 0,
    pending: batches?.filter(b => b.link_status === 'pending').length || 0,
    no_match: batches?.filter(b => b.link_status === 'no_match').length || 0,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/logistique')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                <Factory className="h-6 w-6 text-primary" />
                Batches WS7
              </h1>
              <p className="text-sm text-muted-foreground">{batches?.length || 0} batch(es) importé(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => navigate('/ws7-import')}>
              Import CSV
            </Button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map(opt => {
            // For 'all', use total from query; others use filtered counts from 'all' query
            const count = filter === 'all' ? counts[opt.value] : (opt.value === filter ? filtered.length : '');
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                  filter === opt.value
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-card border-border hover:border-primary/20 text-muted-foreground'
                )}
              >
                <opt.icon className={cn('h-3 w-3', filter === opt.value ? 'text-primary' : opt.color)} />
                {opt.label}
                {counts[opt.value] > 0 && (
                  <span className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-[10px]">
                    {counts[opt.value]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher batch, client, formule..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Batches Table */}
        <Card className="border-border/50 bg-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Factory className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Aucun batch trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N°</TableHead>
                      <TableHead>Date/Heure</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Formule</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead>Opérateur</TableHead>
                      <TableHead>Statut lien</TableHead>
                      <TableHead>BL lié</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(batch => (
                      <TableRow
                        key={batch.id}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => openDetail(batch)}
                      >
                        <TableCell className="font-mono font-medium">{batch.batch_number}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(batch.batch_datetime), 'dd/MM HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">{batch.client_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">{batch.formula}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{batch.total_volume_m3} m³</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{batch.operator_name}</TableCell>
                        <TableCell>{statusBadge(batch.link_status, batch.link_confidence)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {batch.linked_bl_id ? (
                            <span className="text-primary">{batch.linked_bl_id.slice(0, 8)}...</span>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Batch Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-primary" />
                Batch #{selectedBatch?.batch_number}
              </DialogTitle>
            </DialogHeader>

            {selectedBatch && (
              <div className="space-y-4">
                {/* Batch Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Date/Heure</p>
                    <p className="font-medium">{format(new Date(selectedBatch.batch_datetime), 'dd MMM yyyy HH:mm', { locale: fr })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Client</p>
                    <p className="font-medium">{selectedBatch.client_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Formule</p>
                    <Badge variant="outline" className="font-mono">{selectedBatch.formula}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Volume</p>
                    <p className="font-mono font-medium">{selectedBatch.total_volume_m3} m³</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Opérateur</p>
                    <p className="font-medium">{selectedBatch.operator_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Statut</p>
                    {statusBadge(selectedBatch.link_status, selectedBatch.link_confidence)}
                  </div>
                </div>

                {/* Material Breakdown */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Composition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-muted/30 rounded p-2 text-center">
                        <p className="text-muted-foreground">Ciment</p>
                        <p className="font-mono font-bold">{selectedBatch.cement_kg} kg</p>
                      </div>
                      <div className="bg-muted/30 rounded p-2 text-center">
                        <p className="text-muted-foreground">Sable</p>
                        <p className="font-mono font-bold">{selectedBatch.sand_kg} kg</p>
                      </div>
                      <div className="bg-muted/30 rounded p-2 text-center">
                        <p className="text-muted-foreground">Gravette</p>
                        <p className="font-mono font-bold">{selectedBatch.gravel_kg} kg</p>
                      </div>
                      <div className="bg-muted/30 rounded p-2 text-center">
                        <p className="text-muted-foreground">Eau</p>
                        <p className="font-mono font-bold">{selectedBatch.water_liters} L</p>
                      </div>
                      <div className="bg-muted/30 rounded p-2 text-center">
                        <p className="text-muted-foreground">Adjuvants</p>
                        <p className="font-mono font-bold">{selectedBatch.additives_liters} L</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Linking Section */}
                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold">Liaison BL</h3>

                  {selectedBatch.linked_bl_id && (
                    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <Link2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-mono font-medium">{selectedBatch.linked_bl_id}</p>
                        <p className="text-xs text-muted-foreground">Confiance: {selectedBatch.link_confidence}%</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs">Lier manuellement à un BL</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="ID du BL (ex: BL-2026-0001)"
                        value={linkBlId}
                        onChange={e => setLinkBlId(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleManualLink} disabled={linking || !linkBlId.trim()} size="sm">
                        {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleAutoRelink}
                    disabled={relinking}
                  >
                    {relinking ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Relancer l'auto-liaison
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
