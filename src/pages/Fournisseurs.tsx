import React, { useState } from 'react';
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
import { fr } from 'date-fns/locale';
import PurchaseOrderForm from '@/components/suppliers/PurchaseOrderForm';

const statusColors: Record<string, string> = {
  en_attente: 'bg-yellow-100 text-yellow-800',
  confirmee: 'bg-blue-100 text-blue-800',
  en_transit: 'bg-purple-100 text-purple-800',
  livree: 'bg-green-100 text-green-800',
  annulee: 'bg-red-100 text-red-800',
  partiel: 'bg-orange-100 text-orange-800',
  payee: 'bg-green-100 text-green-800',
  en_retard: 'bg-red-100 text-red-800',
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion Fournisseurs</h1>
            <p className="text-muted-foreground">Achats, paiements et réapprovisionnement</p>
          </div>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">Fournisseurs</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalFournisseurs}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-muted-foreground">Cmd. en cours</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.commandesEnCours}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <span className="text-sm text-muted-foreground">Montant Cmd.</span>
              </div>
              <p className="text-xl font-bold mt-1">{formatCurrency(stats.montantCommandesEnCours)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                <span className="text-sm text-muted-foreground">Factures dues</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.facturesEnAttente}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">Montant dû</span>
              </div>
              <p className="text-xl font-bold mt-1">{formatCurrency(stats.montantDu)}</p>
            </CardContent>
          </Card>
          
          <Card className={stats.facturesEnRetard > 0 ? 'border-red-300 bg-red-50' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${stats.facturesEnRetard > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                <span className="text-sm text-muted-foreground">En retard</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${stats.facturesEnRetard > 0 ? 'text-red-600' : ''}`}>
                {stats.facturesEnRetard}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reorder Alerts */}
        {alertesReappro.filter(a => a.actif).length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertes de Réapprovisionnement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {alertesReappro.filter(a => a.actif).map(alerte => (
                  <div key={alerte.id} className="bg-white p-3 rounded-lg border border-amber-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{alerte.materiau}</p>
                        <p className="text-xs text-muted-foreground">
                          Seuil: {alerte.seuil_alerte} | Commander: {alerte.quantite_reorder}
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
              Fournisseurs
            </TabsTrigger>
            <TabsTrigger value="achats" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="factures" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Factures
            </TabsTrigger>
            <TabsTrigger value="alertes" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertes Stock
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
                    Nouveau Fournisseur
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouveau Fournisseur</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Code</Label>
                        <Input
                          value={newFournisseur.code_fournisseur}
                          onChange={(e) => setNewFournisseur({ ...newFournisseur, code_fournisseur: e.target.value })}
                          placeholder="FOUR-005"
                        />
                      </div>
                      <div>
                        <Label>Nom</Label>
                        <Input
                          value={newFournisseur.nom_fournisseur}
                          onChange={(e) => setNewFournisseur({ ...newFournisseur, nom_fournisseur: e.target.value })}
                          placeholder="Nom du fournisseur"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Contact</Label>
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
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newFournisseur.contact_email}
                        onChange={(e) => setNewFournisseur({ ...newFournisseur, contact_email: e.target.value })}
                        placeholder="contact@fournisseur.ma"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Ville</Label>
                        <Input
                          value={newFournisseur.ville}
                          onChange={(e) => setNewFournisseur({ ...newFournisseur, ville: e.target.value })}
                          placeholder="Casablanca"
                        />
                      </div>
                      <div>
                        <Label>Conditions paiement</Label>
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
                      Créer le fournisseur
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Statut</TableHead>
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
                          {f.actif ? 'Actif' : 'Inactif'}
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
                Nouvelle Commande
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Commandes d'Achat
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune commande enregistrée</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Livraison prévue</TableHead>
                        <TableHead>Montant TTC</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
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
                                Confirmer
                              </Button>
                            )}
                            {a.statut === 'confirmee' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateAchatStatus(a.id, 'en_transit')}
                              >
                                En transit
                              </Button>
                            )}
                            {a.statut === 'en_transit' && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => updateAchatStatus(a.id, 'livree', new Date().toISOString().split('T')[0])}
                              >
                                Réceptionner
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
                  Factures Fournisseurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {facturesFournisseur.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune facture enregistrée</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Facture</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead>Montant TTC</TableHead>
                        <TableHead>Payé</TableHead>
                        <TableHead>Reste</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
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
                                  Payer
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
                  Configuration des Alertes de Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matériau</TableHead>
                      <TableHead>Seuil d'alerte</TableHead>
                      <TableHead>Quantité à commander</TableHead>
                      <TableHead>Fournisseur préféré</TableHead>
                      <TableHead>Délai</TableHead>
                      <TableHead>Dernière alerte</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertesReappro.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.materiau}</TableCell>
                        <TableCell>{a.seuil_alerte.toLocaleString()}</TableCell>
                        <TableCell>{a.quantite_reorder.toLocaleString()}</TableCell>
                        <TableCell>{a.fournisseur?.nom_fournisseur || '-'}</TableCell>
                        <TableCell>{a.delai_commande_jours} jours</TableCell>
                        <TableCell>
                          {a.derniere_alerte 
                            ? format(new Date(a.derniere_alerte), 'dd/MM/yyyy HH:mm', { locale: fr })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.actif ? 'default' : 'secondary'}>
                            {a.actif ? 'Actif' : 'Inactif'}
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
              <DialogTitle>Enregistrer un paiement</DialogTitle>
            </DialogHeader>
            {selectedFacture && (
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">Facture: <span className="font-mono">{selectedFacture.numero_facture}</span></p>
                  <p className="text-sm">Fournisseur: {selectedFacture.fournisseur?.nom_fournisseur}</p>
                  <p className="text-sm">
                    Reste à payer: <span className="font-bold text-orange-600">
                      {formatCurrency(selectedFacture.montant_ttc - (selectedFacture.montant_paye || 0))}
                    </span>
                  </p>
                </div>
                
                <div>
                  <Label>Montant</Label>
                  <Input
                    type="number"
                    value={paymentForm.montant}
                    onChange={(e) => setPaymentForm({ ...paymentForm, montant: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <Label>Mode de paiement</Label>
                  <Select
                    value={paymentForm.mode_paiement}
                    onValueChange={(v) => setPaymentForm({ ...paymentForm, mode_paiement: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virement">Virement</SelectItem>
                      <SelectItem value="cheque">Chèque</SelectItem>
                      <SelectItem value="especes">Espèces</SelectItem>
                      <SelectItem value="traite">Traite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Référence</Label>
                  <Input
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    placeholder="N° chèque, virement..."
                  />
                </div>
                
                <Button onClick={handleRecordPayment} className="w-full">
                  Enregistrer le paiement
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
