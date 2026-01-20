import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  FileEdit,
  Trash2,
  Plus,
  RefreshCw,
  Shield,
  Calendar,
  User,
  Database,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

const TABLE_LABELS: Record<string, string> = {
  prix_achat_actuels: 'Prix',
  clients: 'Clients',
  factures: 'Factures',
  bons_livraison_reels: 'BL',
  bons_commande: 'BC',
  approbations: 'Approbations',
};

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  INSERT: { icon: Plus, color: 'text-green-600 bg-green-100', label: 'Création' },
  UPDATE: { icon: FileEdit, color: 'text-amber-600 bg-amber-100', label: 'Modification' },
  DELETE: { icon: Trash2, color: 'text-red-600 bg-red-100', label: 'Suppression' },
};

function JsonDiff({ label, oldValue, newValue }: { label: string; oldValue: unknown; newValue: unknown }) {
  const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);
  
  if (!hasChanged && oldValue === undefined && newValue === undefined) return null;
  
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/50 last:border-0">
      <div className="font-medium text-sm text-muted-foreground">{label}</div>
      <div className={cn(
        "text-sm font-mono break-all",
        hasChanged && "text-red-600 line-through"
      )}>
        {oldValue !== undefined ? String(oldValue) : '—'}
      </div>
      <div className={cn(
        "text-sm font-mono break-all",
        hasChanged && "text-green-600 font-semibold"
      )}>
        {newValue !== undefined ? String(newValue) : '—'}
      </div>
    </div>
  );
}

function AuditLogRow({ log }: { log: AuditLog }) {
  const [isOpen, setIsOpen] = useState(false);
  const actionConfig = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
  const ActionIcon = actionConfig.icon;
  
  // Get all keys from both old and new data
  const allKeys = useMemo(() => {
    const keys = new Set<string>();
    if (log.old_data) Object.keys(log.old_data).forEach(k => keys.add(k));
    if (log.new_data) Object.keys(log.new_data).forEach(k => keys.add(k));
    // Filter out noisy fields
    ['updated_at', 'created_at', 'id'].forEach(k => keys.delete(k));
    return Array.from(keys).sort();
  }, [log.old_data, log.new_data]);

  // For UPDATE, only show changed fields
  const displayKeys = useMemo(() => {
    if (log.action === 'UPDATE' && log.changes) {
      return Object.keys(log.changes).filter(k => !['updated_at', 'created_at'].includes(k));
    }
    return allKeys;
  }, [log.action, log.changes, allKeys]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <TableCell className="w-10">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-full", actionConfig.color)}>
              <ActionIcon className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium">{actionConfig.label}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{TABLE_LABELS[log.table_name] || log.table_name}</Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{log.user_name || 'Superviseur'}</span>
          </div>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">
          {log.record_id?.substring(0, 8) || '—'}
        </TableCell>
        <TableCell>
          <div className="text-sm">
            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
          </div>
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}>
            <Eye className="h-4 w-4 mr-1" />
            Détails
          </Button>
        </TableCell>
      </TableRow>
      
      <CollapsibleContent asChild>
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={7} className="p-0">
            <div className="p-4 border-l-4 border-primary">
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Données modifiées</span>
                <Badge variant="secondary" className="text-xs">
                  {displayKeys.length} champ{displayKeys.length > 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="bg-background rounded-lg border">
                <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 border-b font-medium text-sm">
                  <div>Champ</div>
                  <div>Ancienne valeur</div>
                  <div>Nouvelle valeur</div>
                </div>
                <ScrollArea className="max-h-64">
                  <div className="p-2">
                    {displayKeys.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">Aucune donnée détaillée</div>
                    ) : (
                      displayKeys.map(key => (
                        <JsonDiff
                          key={key}
                          label={key}
                          oldValue={log.old_data?.[key]}
                          newValue={log.new_data?.[key]}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AuditSuperviseur() {
  const [search, setSearch] = useState('');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-superviseur'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_superviseur')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return data as AuditLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          log.user_name?.toLowerCase().includes(searchLower) ||
          log.table_name.toLowerCase().includes(searchLower) ||
          log.record_id?.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.changes || {}).toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Table filter
      if (tableFilter !== 'all' && log.table_name !== tableFilter) return false;
      
      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      
      return true;
    });
  }, [logs, search, tableFilter, actionFilter]);

  const stats = useMemo(() => ({
    total: logs.length,
    today: logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length,
    inserts: logs.filter(l => l.action === 'INSERT').length,
    updates: logs.filter(l => l.action === 'UPDATE').length,
    deletes: logs.filter(l => l.action === 'DELETE').length,
  }), [logs]);

  const uniqueTables = useMemo(() => 
    [...new Set(logs.map(l => l.table_name))].sort(),
  [logs]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Journal d'Audit - Superviseur
            </h1>
            <p className="text-muted-foreground mt-1">
              Traçabilité complète des actions de Karim (Superviseur)
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total actions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">{stats.today}</div>
              <div className="text-sm text-muted-foreground">Aujourd'hui</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.inserts}</div>
              <div className="text-sm text-muted-foreground">Créations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-600">{stats.updates}</div>
              <div className="text-sm text-muted-foreground">Modifications</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{stats.deletes}</div>
              <div className="text-sm text-muted-foreground">Suppressions</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par utilisateur, table, données..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Database className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les tables</SelectItem>
                  {uniqueTables.map(table => (
                    <SelectItem key={table} value={table}>
                      {TABLE_LABELS[table] || table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <FileEdit className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="INSERT">Créations</SelectItem>
                  <SelectItem value="UPDATE">Modifications</SelectItem>
                  <SelectItem value="DELETE">Suppressions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Historique des actions
              </CardTitle>
              <Badge variant="secondary">{filteredLogs.length} entrée{filteredLogs.length > 1 ? 's' : ''}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg">Aucune action enregistrée</h3>
                <p className="text-muted-foreground text-sm">
                  Les actions du Superviseur apparaîtront ici
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => (
                    <AuditLogRow key={log.id} log={log} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}