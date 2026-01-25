import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Building2, 
  Truck, 
  Cpu, 
  Armchair, 
  Wrench, 
  Package,
  TrendingDown,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  useFixedAssets, 
  FixedAsset, 
  AssetCategory, 
  AssetStatus,
  CATEGORY_LABELS,
  STATUS_LABELS 
} from '@/hooks/useFixedAssets';
import { CreateAssetDialog } from './CreateAssetDialog';
import { AssetDetailDialog } from './AssetDetailDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const CATEGORY_ICONS: Record<AssetCategory, React.ComponentType<any>> = {
  batiments: Building2,
  vehicules: Truck,
  equipements: Package,
  mobilier: Armchair,
  informatique: Cpu,
  outils: Wrench,
  autre: Package,
};

const STATUS_COLORS: Record<AssetStatus, string> = {
  new: 'bg-blue-500/10 text-blue-500',
  active: 'bg-green-500/10 text-green-500',
  maintenance: 'bg-yellow-500/10 text-yellow-500',
  inactive: 'bg-gray-500/10 text-gray-500',
  pending_disposal: 'bg-orange-500/10 text-orange-500',
  disposed: 'bg-red-500/10 text-red-500',
};

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
];

export function FixedAssetsDashboard() {
  const { assets, summary, loading, totals, updateAssetStatus } = useFixedAssets();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Prepare chart data
  const pieData = summary.map((s, index) => ({
    name: CATEGORY_LABELS[s.category],
    value: s.net_value,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const barData = summary.map(s => ({
    name: CATEGORY_LABELS[s.category],
    brut: s.gross_value,
    amortissement: s.accumulated_depreciation,
    vnc: s.net_value,
  }));

  // Assets needing attention
  const warrantyExpiring = assets.filter(a => {
    if (!a.warranty_end_date || a.status === 'disposed') return false;
    const daysLeft = differenceInDays(new Date(a.warranty_end_date), new Date());
    return daysLeft > 0 && daysLeft <= 30;
  });

  const handleViewAsset = (asset: FixedAsset) => {
    setSelectedAsset(asset);
    setDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Immobilisations</h1>
          <p className="text-muted-foreground">Registre des actifs et amortissements</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Actif
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Brut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.grossValue.toLocaleString()} DH</p>
            <p className="text-xs text-muted-foreground">{totals.assetCount} actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Amortissements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-500">-{totals.accumulatedDepreciation.toLocaleString()} DH</p>
            <p className="text-xs text-muted-foreground">Mensuel: {totals.monthlyDepreciation.toLocaleString()} DH</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Valeur Nette (VNC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">{totals.netBookValue.toLocaleString()} DH</p>
            <p className="text-xs text-muted-foreground">
              {((totals.netBookValue / totals.grossValue) * 100 || 0).toFixed(1)}% de la valeur brute
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Garanties Expirant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-500">{warrantyExpiring.length}</p>
            <p className="text-xs text-muted-foreground">Dans les 30 prochains jours</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Liste des Actifs</TabsTrigger>
          <TabsTrigger value="summary">Résumé par Catégorie</TabsTrigger>
          <TabsTrigger value="charts">Visualisation</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par ID, description, N° série..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Assets Table */}
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : filteredAssets.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun actif trouvé</p>
                  <Button variant="outline" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le premier actif
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Valeur Brute</TableHead>
                      <TableHead className="text-right">VNC</TableHead>
                      <TableHead>Emplacement</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => {
                      const CategoryIcon = CATEGORY_ICONS[asset.category];
                      return (
                        <TableRow key={asset.id} className="cursor-pointer" onClick={() => handleViewAsset(asset)}>
                          <TableCell className="font-mono text-sm">{asset.asset_id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="max-w-[200px] truncate">{asset.description}</span>
                            </div>
                          </TableCell>
                          <TableCell>{CATEGORY_LABELS[asset.category]}</TableCell>
                          <TableCell className="text-right font-mono">
                            {asset.purchase_price.toLocaleString()} DH
                          </TableCell>
                          <TableCell className="text-right font-mono text-green-500">
                            {asset.net_book_value.toLocaleString()} DH
                          </TableCell>
                          <TableCell>{asset.location}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[asset.status]}>
                              {STATUS_LABELS[asset.status]}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewAsset(asset)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateAssetStatus(asset.id, 'active')}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Marquer actif
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateAssetStatus(asset.id, 'maintenance')}>
                                  <Wrench className="h-4 w-4 mr-2" />
                                  En maintenance
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Résumé par Catégorie
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune donnée disponible
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Nombre</TableHead>
                      <TableHead className="text-right">Valeur Brute</TableHead>
                      <TableHead className="text-right">Amortissements</TableHead>
                      <TableHead className="text-right">VNC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.map((s) => {
                      const CategoryIcon = CATEGORY_ICONS[s.category];
                      return (
                        <TableRow key={s.category}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              {CATEGORY_LABELS[s.category]}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{s.asset_count}</TableCell>
                          <TableCell className="text-right font-mono">
                            {s.gross_value.toLocaleString()} DH
                          </TableCell>
                          <TableCell className="text-right font-mono text-orange-500">
                            -{s.accumulated_depreciation.toLocaleString()} DH
                          </TableCell>
                          <TableCell className="text-right font-mono text-green-500">
                            {s.net_value.toLocaleString()} DH
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{totals.assetCount}</TableCell>
                      <TableCell className="text-right font-mono">
                        {totals.grossValue.toLocaleString()} DH
                      </TableCell>
                      <TableCell className="text-right font-mono text-orange-500">
                        -{totals.accumulatedDepreciation.toLocaleString()} DH
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-500">
                        {totals.netBookValue.toLocaleString()} DH
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Répartition VNC par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground h-[300px] flex items-center justify-center">
                    Aucune donnée
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `${value.toLocaleString()} DH`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Valeurs par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                {barData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground h-[300px] flex items-center justify-center">
                    Aucune donnée
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData} layout="vertical">
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} DH`} />
                      <Legend />
                      <Bar dataKey="brut" name="Valeur Brute" fill="hsl(var(--primary))" />
                      <Bar dataKey="vnc" name="VNC" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateAssetDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <AssetDetailDialog 
        asset={selectedAsset} 
        open={detailDialogOpen} 
        onOpenChange={setDetailDialogOpen} 
      />
    </div>
  );
}
