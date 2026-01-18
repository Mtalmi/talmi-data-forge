import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useSalesWorkflow, Devis, BonCommande } from '@/hooks/useSalesWorkflow';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  ShoppingCart,
  Truck,
  CheckCircle,
  XCircle,
  ArrowRight,
  Clock,
  Lock,
  Loader2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DevisPdfGenerator from '@/components/quotes/DevisPdfGenerator';
import SmartQuoteCalculator from '@/components/quotes/SmartQuoteCalculator';
import { cn } from '@/lib/utils';

const DEVIS_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente: { label: 'En Attente', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
  accepte: { label: 'Accepté', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  refuse: { label: 'Refusé', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <XCircle className="h-3 w-3" /> },
  converti: { label: 'Converti en BC', color: 'bg-primary/10 text-primary border-primary/30', icon: <ArrowRight className="h-3 w-3" /> },
  expire: { label: 'Expiré', color: 'bg-muted text-muted-foreground border-muted', icon: <AlertTriangle className="h-3 w-3" /> },
};

const BC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pret_production: { label: 'Prêt Production', color: 'bg-primary/10 text-primary border-primary/30', icon: <CheckCircle className="h-3 w-3" /> },
  en_production: { label: 'En Production', color: 'bg-warning/10 text-warning border-warning/30', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  livre: { label: 'Livré', color: 'bg-success/10 text-success border-success/30', icon: <Truck className="h-3 w-3" /> },
};

export default function Ventes() {
  const { isCeo, canCreateBons } = useAuth();
  const { devisList, bcList, loading, stats, fetchData, convertToBc, updateDevisStatus } = useSalesWorkflow();
  
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [converting, setConverting] = useState(false);

  const handleConvertToBc = async () => {
    if (!selectedDevis) return;
    
    setConverting(true);
    await convertToBc(selectedDevis, {
      date_livraison_souhaitee: deliveryDate || undefined,
      adresse_livraison: deliveryAddress || undefined,
    });
    setConverting(false);
    setConvertDialogOpen(false);
    setSelectedDevis(null);
    setDeliveryDate('');
    setDeliveryAddress('');
  };

  const openConvertDialog = (devis: Devis) => {
    setSelectedDevis(devis);
    setDeliveryAddress(devis.client?.adresse || '');
    setConvertDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline Commercial</h1>
            <p className="text-muted-foreground">
              Gestion des devis et bons de commande
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Actualiser
            </Button>
            <SmartQuoteCalculator />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <FileText className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.devisEnAttente}</p>
                  <p className="text-xs text-muted-foreground">Devis en attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.bcPretProduction}</p>
                  <p className="text-xs text-muted-foreground">BC prêts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalDevisHT.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">DH en devis</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Truck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.bcLivre}</p>
                  <p className="text-xs text-muted-foreground">BC livrés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Flux Commercial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 py-4">
              {/* Devis Stage */}
              <div className="flex-1 text-center">
                <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-warning/10 border border-warning/30">
                  <FileText className="h-8 w-8 text-warning" />
                  <p className="font-semibold">{stats.devisEnAttente} Devis</p>
                  <p className="text-xs text-muted-foreground">En Attente</p>
                </div>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              
              {/* BC Stage */}
              <div className="flex-1 text-center">
                <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                  <p className="font-semibold">{stats.bcPretProduction} BC</p>
                  <p className="text-xs text-muted-foreground">Validés</p>
                </div>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              
              {/* Production Stage */}
              <div className="flex-1 text-center">
                <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-accent/10 border border-accent/30">
                  <Loader2 className="h-8 w-8 text-accent" />
                  <p className="font-semibold">{stats.bcEnProduction} BC</p>
                  <p className="text-xs text-muted-foreground">En Production</p>
                </div>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              
              {/* Delivered Stage */}
              <div className="flex-1 text-center">
                <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-success/10 border border-success/30">
                  <Truck className="h-8 w-8 text-success" />
                  <p className="font-semibold">{stats.bcLivre} BC</p>
                  <p className="text-xs text-muted-foreground">Livrés</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Devis and BC */}
        <Tabs defaultValue="devis" className="space-y-4">
          <TabsList>
            <TabsTrigger value="devis" className="gap-2">
              <FileText className="h-4 w-4" />
              Devis ({devisList.length})
            </TabsTrigger>
            <TabsTrigger value="bc" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Bons de Commande ({bcList.length})
            </TabsTrigger>
          </TabsList>

          {/* Devis Tab */}
          <TabsContent value="devis">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : devisList.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucun devis enregistré</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Utilisez le Calculateur de Devis pour créer votre premier devis
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Devis</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Formule</TableHead>
                        <TableHead className="text-right">Volume</TableHead>
                        <TableHead className="text-right">Prix/m³</TableHead>
                        <TableHead className="text-right">Total HT</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devisList.map((devis) => {
                        const statusConfig = DEVIS_STATUS_CONFIG[devis.statut] || DEVIS_STATUS_CONFIG.en_attente;
                        return (
                          <TableRow key={devis.id}>
                            <TableCell className="font-mono font-medium">{devis.devis_id}</TableCell>
                            <TableCell>{devis.client?.nom_client || '—'}</TableCell>
                            <TableCell>
                              <span className="text-xs">{devis.formule_id}</span>
                            </TableCell>
                            <TableCell className="text-right font-mono">{devis.volume_m3} m³</TableCell>
                            <TableCell className="text-right font-mono">{devis.prix_vente_m3.toLocaleString()} DH</TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {devis.total_ht.toLocaleString()} DH
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                                {statusConfig.icon}
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DevisPdfGenerator devis={devis} />
                                {devis.statut === 'en_attente' && devis.client_id && (
                                  <Button
                                    size="sm"
                                    onClick={() => openConvertDialog(devis)}
                                    className="gap-1"
                                  >
                                    <ArrowRight className="h-3 w-3" />
                                    Valider BC
                                  </Button>
                                )}
                                {devis.statut === 'en_attente' && !devis.client_id && (
                                  <span className="text-xs text-muted-foreground">
                                    Client requis
                                  </span>
                                )}
                              </div>
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

          {/* BC Tab */}
          <TabsContent value="bc">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : bcList.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucun bon de commande</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Convertissez un devis pour créer un BC
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° BC</TableHead>
                        <TableHead>Devis Source</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Formule</TableHead>
                        <TableHead className="text-right">Volume</TableHead>
                        <TableHead className="text-right">Prix/m³</TableHead>
                        <TableHead className="text-right">Total HT</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Prix</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bcList.map((bc) => {
                        const statusConfig = BC_STATUS_CONFIG[bc.statut] || BC_STATUS_CONFIG.pret_production;
                        return (
                          <TableRow key={bc.id}>
                            <TableCell className="font-mono font-medium">{bc.bc_id}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {bc.devis_id || '—'}
                            </TableCell>
                            <TableCell>{bc.client?.nom_client || '—'}</TableCell>
                            <TableCell>
                              <span className="text-xs">{bc.formule_id}</span>
                            </TableCell>
                            <TableCell className="text-right font-mono">{bc.volume_m3} m³</TableCell>
                            <TableCell className="text-right font-mono">{bc.prix_vente_m3.toLocaleString()} DH</TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {bc.total_ht.toLocaleString()} DH
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                                {statusConfig.icon}
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {bc.prix_verrouille ? (
                                <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive border-destructive/30">
                                  <Lock className="h-3 w-3" />
                                  Verrouillé
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/30">
                                  Modifiable
                                </Badge>
                              )}
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
        </Tabs>
      </div>

      {/* Convert to BC Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Valider en Bon de Commande
            </DialogTitle>
          </DialogHeader>
          
          {selectedDevis && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Récapitulatif du Devis</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">N° Devis:</span>
                  <span className="font-mono">{selectedDevis.devis_id}</span>
                  <span className="text-muted-foreground">Client:</span>
                  <span>{selectedDevis.client?.nom_client}</span>
                  <span className="text-muted-foreground">Volume:</span>
                  <span>{selectedDevis.volume_m3} m³</span>
                  <span className="text-muted-foreground">Prix/m³:</span>
                  <span className="font-mono">{selectedDevis.prix_vente_m3.toLocaleString()} DH</span>
                  <span className="text-muted-foreground">Total HT:</span>
                  <span className="font-mono font-bold text-primary">
                    {selectedDevis.total_ht.toLocaleString()} DH
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Date de livraison souhaitée</Label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Adresse de livraison</Label>
                  <Input
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Adresse du chantier..."
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <strong>Attention:</strong> Le prix de vente sera verrouillé après validation
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Seul le CEO pourra modifier le prix une fois le BC créé
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleConvertToBc} disabled={converting} className="gap-2">
              {converting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Valider le BC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
