import React, { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Package, 
  FileText, 
  AlertTriangle, 
  Plus, 
  Search,
  TrendingUp,
  Clock,
  CreditCard,
  Star,
  Truck,
  RefreshCw,
  ShoppingCart
} from 'lucide-react';
import { useFournisseurs, Fournisseur, Achat, FactureFournisseur } from '@/hooks/useFournisseurs';
import { format } from 'date-fns';

import PurchaseOrderForm from '@/components/suppliers/PurchaseOrderForm';

const statusColors: Record<string, string> = {
  en_attente: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  confirmee: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  en_transit: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  livree: 'bg-green-500/20 text-green-400 border border-green-500/30',
  annulee: 'bg-red-500/20 text-red-400 border border-red-500/30',
  partiel: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  payee: 'bg-green-500/20 text-green-400 border border-green-500/30',
  en_retard: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const statusLabels: Record<string, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  en_transit: 'En transit',
  livree: 'Livrée',
  annulee: 'Annulée',
  partiel: 'Partiel',
  payee: 'Payée',
  en_retard: 'En retard',
};

export default function Fournisseurs() {
  const { t } = useI18n();
  const { 
    fournisseurs, 
    achats, 
    facturesFournisseur, 
    alertesReappro,
    loading, 
    stats,
    refresh,
    createFournisseur,
    createAchat,
    updateAchatStatus,
    recordPayment,
  } = useFournisseurs();

  const [searchTerm, setSearchTerm] = useState('');
  const [showNewFournisseur, setShowNewFournisseur] = useState(false);
  const [showNewAchat, setShowNewAchat] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<FactureFournisseur | null>(null);
  
  // New supplier form state
  const [newFournisseur, setNewFournisseur] = useState({
    code_fournisseur: '',
    nom_fournisseur: '',
    contact_nom: '',
    contact_telephone: '',
    contact_email: '',
    ville: '',
    conditions_paiement: 'Net 30',
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    montant: 0,
    mode_paiement: 'virement',
    reference: '',
  });

  const handleCreateFournisseur = async () => {
    const success = await createFournisseur(newFournisseur);
    if (success) {
      setShowNewFournisseur(false);
      setNewFournisseur({
        code_fournisseur: '',
        nom_fournisseur: '',
        contact_nom: '',
        contact_telephone: '',
        contact_email: '',
        ville: '',
        conditions_paiement: 'Net 30',
      });
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedFacture) return;
    const success = await recordPayment(
      selectedFacture.id,
      selectedFacture.fournisseur_id,
      paymentForm.montant,
      paymentForm.mode_paiement,
      paymentForm.reference
    );
    if (success) {
      setShowPaymentDialog(false);
      setSelectedFacture(null);
      setPaymentForm({ montant: 0, mode_paiement: 'virement', reference: '' });
    }
  };

  const formatCurrency = (val: number) => val.toLocaleString('fr-FR') + ' DH';

  const filteredFournisseurs = fournisseurs.filter(f =>
    f.nom_fournisseur.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.code_fournisseur.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-3xl font-bold text-foreground">{t.pages.fournisseurs.title}</h1>
            <p className="text-xs sm:text-base text-muted-foreground">{t.pages.fournisseurs.subtitle}</p>
          </div>
          <Button onClick={refresh} variant="outline" size="sm" className="min-h-[40px] self-start sm:self-auto">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.pages.fournisseurs.refresh}</span>
          </Button>
        </div>

        {/* KPI Cards - Horizontal scroll on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">{t.pages.fournisseurs.suppliers}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalFournisseurs}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-muted-foreground">{t.pages.fournisseurs.ordersInProgress}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.commandesEnCours}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <span className="text-sm text-muted-foreground">{t.pages.fournisseurs.orderAmount}</span>
              </div>
              <p className="text-xl font-bold mt-1">{formatCurrency(stats.montantCommandesEnCours)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                <span className="text-sm text-muted-foreground">{t.pages.fournisseurs.dueInvoices}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.facturesEnAttente}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">{t.pages.fournisseurs.amountDue}</span>
              </div>
              <p className="text-xl font-bold mt-1">{formatCurrency(stats.montantDu)}</p>
            </CardContent>
          </Card>
          
          <Card className={stats.facturesEnRetard > 0 ? 'border-red-500/30 bg-red-500/10' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${stats.facturesEnRetard > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                <span className="text-sm text-muted-foreground">{t.pages.fournisseurs.overdue}</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${stats.facturesEnRetard > 0 ? 'text-red-600' : ''}`}>
                {stats.facturesEnRetard}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reorder Alerts */}
        {alertesReappro.filter(a => a.actif).length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {t.pages.fournisseurs.reorderAlertsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {alertesReappro.filter(a => a.actif).map(alerte => (
                  <div key={alerte.id} className="bg-card p-3 rounded-lg border border-amber-500/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{alerte.materiau}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.pages.fournisseurs.threshold}: {alerte.seuil_alerte} | {t.pages.fournisseurs.reorderQty}: {alerte.quantite_reorder}
                        </p>
                      </div>
                      {alerte.fournisseur && (
                        <Badge variant="outline" className="text-xs">
                          {alerte.fournisseur.code_fournisseur}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="fournisseurs">
          <TabsList className="grid w-full grid-cols-4">
             <TabsTrigger value="fournisseurs" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t.pages.fournisseurs.suppliers}
            </TabsTrigger>
            <TabsTrigger value="achats" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t.pages.fournisseurs.ordersTab}
            </TabsTrigger>
            <TabsTrigger value="factures" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t.pages.fournisseurs.invoicesTab}
            </TabsTrigger>
            <TabsTrigger value="alertes" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t.pages.fournisseurs.stockAlertsTab}
            </TabsTrigger>
          </TabsList>

          {/* Fournisseurs Tab */}
          <TabsContent value="fournisseurs" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Dialog open={showNewFournisseur} onOpenChange={setShowNewFournisseur}>
                <DialogTrigger asChild>
                  <Button>
                     <Plus className="h-4 w-4 mr-2" />
                    {t.pages.fournisseurs.newSupplier}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.pages.fournisseurs.newSupplier}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t.pages.fournisseurs.code}</Label>
                        <Input
                          value={newFournisseur.code_fournisseur}
                          onChange={(e) => setNewFournisseur({ ...newFournisseur, code_fournisseur: e.target.value })}
                          placeholder="FOUR-005"
                        />
                      </div>
                      <div>
                        <Label>{t.pages.fournisseurs.name}</Label>
                        <Input
                          value={newFournisseur.nom_fournisseur}
                          onChange={(e) => setNewFournisseur({ ...newFournisseur, nom_fournisseur: e.target.value })}
                          placeholder="Nom du fournisseur"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t.pages.fournisseurs.contact}</Label>
                        <Input
                          value={newFournisseur.contact_nom}
                          onChange={(e) => setNewFournisseur({ ...newFournisseur, contact_nom: e.target.value })}
                          placeholder="Nom du contact"
                        />
                      </div>
                      <div>
                        <Label>Téléphone</Label>
                        <Input
                          value={newFournisseur.contact_telephone}
                          onChange={(e) => setNewFournisseur({ ...newFournisseur, contact_telephone: e.target.value })}
                          placeholder="0522-123456"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{t.pages.fournisseurs.email}</Label>
                      <Input
                        type="email"
                        value={newFournisseur.contact_email}
                        onChange={(e) => setNewFournisseur({ ...newFournisseur, contact_email: e.target.value })}
                        placeholder="contact@fournisseur.ma"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t.pages.fournisseurs.city}</Label>
                        <Input
                          value={newFournisseur.ville}
                          onChange={(e) => setNewFournisseur({ ...newFournisseur, ville: e.target.value })}
                          placeholder="Casablanca"
                        />
                      </div>
                      <div>
                        <Label>{t.pages.fournisseurs.paymentTerms}</Label>
                        <Select
                          value={newFournisseur.conditions_paiement}
                          onValueChange={(v) => setNewFournisseur({ ...newFournisseur, conditions_paiement: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Comptant">Comptant</SelectItem>
                            <SelectItem value="Net 30">Net 30</SelectItem>
                            <SelectItem value="Net 45">Net 45</SelectItem>
                            <SelectItem value="Net 60">Net 60</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleCreateFournisseur} className="w-full">
                      {t.pages.fournisseurs.createSupplierBtn}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>{t.pages.fournisseurs.code}</TableHead>
                    <TableHead>{t.pages.fournisseurs.supplier}</TableHead>
                    <TableHead>{t.pages.fournisseurs.contact}</TableHead>
                    <TableHead>{t.pages.fournisseurs.city}</TableHead>
                    <TableHead>{t.pages.fournisseurs.terms}</TableHead>
                    <TableHead>{t.pages.fournisseurs.rating}</TableHead>
                    <TableHead>{t.pages.fournisseurs.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFournisseurs.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-sm">{f.code_fournisseur}</TableCell>
                      <TableCell className="font-medium">{f.nom_fournisseur}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{f.contact_nom || '-'}</p>
                          <p className="text-xs text-muted-foreground">{f.contact_telephone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{f.ville || '-'}</TableCell>
                      <TableCell>{f.conditions_paiement}</TableCell>
                      <TableCell>
                        {f.note_qualite && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: f.note_qualite }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={f.actif ? 'default' : 'secondary'}>
                          {f.actif ? t.pages.fournisseurs.active : t.pages.fournisseurs.inactive}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="achats" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowNewAchat(true)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t.pages.fournisseurs.newOrderBtn}
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {t.pages.fournisseurs.orders}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t.pages.fournisseurs.noOrders2}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                         <TableHead>{t.pages.fournisseurs.orderNumber}</TableHead>
                        <TableHead>{t.pages.fournisseurs.supplier}</TableHead>
                        <TableHead>{t.pages.fournisseurs.invoiceDate}</TableHead>
                        <TableHead>{t.pages.fournisseurs.expectedDelivery}</TableHead>
                        <TableHead>{t.pages.fournisseurs.amountTTC}</TableHead>
                        <TableHead>{t.pages.fournisseurs.status}</TableHead>
                        <TableHead>{t.pages.formulas.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {achats.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono">{a.numero_achat}</TableCell>
                          <TableCell>{a.fournisseur?.nom_fournisseur || '-'}</TableCell>
                          <TableCell>{format(new Date(a.date_commande), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            {a.date_livraison_prevue 
                              ? format(new Date(a.date_livraison_prevue), 'dd/MM/yyyy')
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(a.montant_ttc || 0)}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[a.statut]}>
                              {statusLabels[a.statut]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {a.statut === 'en_attente' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateAchatStatus(a.id, 'confirmee')}
                              >
                                {t.pages.fournisseurs.confirm}
                              </Button>
                            )}
                            {a.statut === 'confirmee' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateAchatStatus(a.id, 'en_transit')}
                              >
                                 {t.pages.fournisseurs.inTransit}
                              </Button>
                            )}
                            {a.statut === 'en_transit' && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => updateAchatStatus(a.id, 'livree', new Date().toISOString().split('T')[0])}
                              >
                                {t.pages.fournisseurs.receive}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Factures Tab */}
          <TabsContent value="factures" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t.pages.fournisseurs.supplierInvoices}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {facturesFournisseur.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t.pages.fournisseurs.noInvoices}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                         <TableHead>{t.pages.fournisseurs.invoiceNumber}</TableHead>
                        <TableHead>{t.pages.fournisseurs.supplier}</TableHead>
                        <TableHead>{t.pages.fournisseurs.invoiceDate}</TableHead>
                        <TableHead>{t.pages.fournisseurs.dueDate}</TableHead>
                        <TableHead>{t.pages.fournisseurs.amountTTC}</TableHead>
                        <TableHead>{t.pages.fournisseurs.paid}</TableHead>
                        <TableHead>{t.pages.fournisseurs.remaining}</TableHead>
                        <TableHead>{t.pages.fournisseurs.status}</TableHead>
                        <TableHead>{t.pages.formulas.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturesFournisseur.map(f => {
                        const reste = f.montant_ttc - (f.montant_paye || 0);
                        const isOverdue = new Date(f.date_echeance) < new Date() && f.statut !== 'payee';
                        
                        return (
                          <TableRow key={f.id} className={isOverdue ? 'bg-red-50' : ''}>
                            <TableCell className="font-mono">{f.numero_facture}</TableCell>
                            <TableCell>{f.fournisseur?.nom_fournisseur || '-'}</TableCell>
                            <TableCell>{format(new Date(f.date_facture), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {format(new Date(f.date_echeance), 'dd/MM/yyyy')}
                              {isOverdue && <Clock className="h-3 w-3 inline ml-1" />}
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(f.montant_ttc)}</TableCell>
                            <TableCell className="text-green-600">{formatCurrency(f.montant_paye || 0)}</TableCell>
                            <TableCell className={reste > 0 ? 'text-orange-600 font-medium' : ''}>
                              {formatCurrency(reste)}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[isOverdue ? 'en_retard' : f.statut]}>
                                {statusLabels[isOverdue ? 'en_retard' : f.statut]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {f.statut !== 'payee' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedFacture(f);
                                    setPaymentForm({ ...paymentForm, montant: reste });
                                    setShowPaymentDialog(true);
                                  }}
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  {t.pages.fournisseurs.payBtn}
                                </Button>
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

          {/* Alertes Tab */}
          <TabsContent value="alertes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {t.pages.fournisseurs.stockAlertConfig}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                       <TableHead>{t.pages.fournisseurs.material}</TableHead>
                      <TableHead>{t.pages.fournisseurs.alertThreshold}</TableHead>
                      <TableHead>{t.pages.fournisseurs.orderQty}</TableHead>
                      <TableHead>{t.pages.fournisseurs.preferredSupplier}</TableHead>
                      <TableHead>{t.pages.fournisseurs.leadTime}</TableHead>
                      <TableHead>{t.pages.fournisseurs.lastAlert}</TableHead>
                      <TableHead>{t.pages.fournisseurs.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertesReappro.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.materiau}</TableCell>
                        <TableCell>{a.seuil_alerte.toLocaleString()}</TableCell>
                        <TableCell>{a.quantite_reorder.toLocaleString()}</TableCell>
                        <TableCell>{a.fournisseur?.nom_fournisseur || '-'}</TableCell>
                        <TableCell>{a.delai_commande_jours} {t.pages.fournisseurs.days}</TableCell>
                        <TableCell>
                          {a.derniere_alerte 
                            ? format(new Date(a.derniere_alerte), 'dd/MM/yyyy HH:mm')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.actif ? 'default' : 'secondary'}>
                            {a.actif ? t.pages.fournisseurs.active : t.pages.fournisseurs.inactive}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.pages.fournisseurs.recordPayment}</DialogTitle>
            </DialogHeader>
            {selectedFacture && (
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-lg">
                   <p className="text-sm">{t.pages.fournisseurs.invoice}: <span className="font-mono">{selectedFacture.numero_facture}</span></p>
                   <p className="text-sm">{t.pages.fournisseurs.supplier}: {selectedFacture.fournisseur?.nom_fournisseur}</p>
                   <p className="text-sm">
                     {t.pages.fournisseurs.remainingToPay}: <span className="font-bold text-orange-600">
                       {formatCurrency(selectedFacture.montant_ttc - (selectedFacture.montant_paye || 0))}
                    </span>
                  </p>
                </div>
                
                <div>
                  <Label>{t.pages.fournisseurs.paymentAmount}</Label>
                  <Input
                    type="number"
                    value={paymentForm.montant}
                    onChange={(e) => setPaymentForm({ ...paymentForm, montant: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <Label>{t.pages.fournisseurs.paymentMode}</Label>
                  <Select
                    value={paymentForm.mode_paiement}
                    onValueChange={(v) => setPaymentForm({ ...paymentForm, mode_paiement: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="virement">{t.pages.fournisseurs.transfer}</SelectItem>
                      <SelectItem value="cheque">{t.pages.fournisseurs.check}</SelectItem>
                      <SelectItem value="especes">{t.pages.fournisseurs.cash}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>{t.pages.fournisseurs.reference}</Label>
                  <Input
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    placeholder="N° chèque, virement..."
                  />
                </div>
                
                <Button onClick={handleRecordPayment} className="w-full">
                  {t.pages.fournisseurs.recordPaymentBtn}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Purchase Order Form */}
        <PurchaseOrderForm
          open={showNewAchat}
          onOpenChange={setShowNewAchat}
          fournisseurs={fournisseurs}
          onSubmit={createAchat}
        />
      </div>
    </MainLayout>
  );
}
