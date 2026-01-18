import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useZonesLivraison, ZoneLivraison, PrestaireTransport } from '@/hooks/useZonesLivraison';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  MapPin,
  Truck,
  Plus,
  Edit,
  Loader2,
  Star,
  Phone,
  User,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Prestataires() {
  const { isCeo, isDirecteurOperations } = useAuth();
  const { zones, prestataires, loading, fetchData, updateZonePrix } = useZonesLivraison();
  
  const [editingZone, setEditingZone] = useState<ZoneLivraison | null>(null);
  const [editPrix, setEditPrix] = useState('');
  const [saving, setSaving] = useState(false);

  const [addPrestataireOpen, setAddPrestataireOpen] = useState(false);
  const [prestataireForm, setPrestataireForm] = useState({
    code_prestataire: '',
    nom_prestataire: '',
    contact_nom: '',
    contact_telephone: '',
    tarif_base_m3: '',
    note_service: '4',
  });
  const [addingPrestataire, setAddingPrestataire] = useState(false);

  const canManage = isCeo || isDirecteurOperations;

  const handleSaveZonePrix = async () => {
    if (!editingZone) return;
    setSaving(true);
    await updateZonePrix(editingZone.id, parseFloat(editPrix));
    setSaving(false);
    setEditingZone(null);
  };

  const handleAddPrestataire = async () => {
    if (!prestataireForm.code_prestataire || !prestataireForm.nom_prestataire || !prestataireForm.tarif_base_m3) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setAddingPrestataire(true);
    try {
      const { error } = await supabase.from('prestataires_transport').insert({
        code_prestataire: prestataireForm.code_prestataire,
        nom_prestataire: prestataireForm.nom_prestataire,
        contact_nom: prestataireForm.contact_nom || null,
        contact_telephone: prestataireForm.contact_telephone || null,
        tarif_base_m3: parseFloat(prestataireForm.tarif_base_m3),
        note_service: parseInt(prestataireForm.note_service) || null,
      });

      if (error) throw error;
      toast.success('Prestataire ajouté');
      setAddPrestataireOpen(false);
      setPrestataireForm({
        code_prestataire: '',
        nom_prestataire: '',
        contact_nom: '',
        contact_telephone: '',
        tarif_base_m3: '',
        note_service: '4',
      });
      fetchData();
    } catch (error) {
      console.error('Error adding prestataire:', error);
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setAddingPrestataire(false);
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return '—';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-4 w-4',
              star <= rating ? 'text-warning fill-warning' : 'text-muted-foreground/30'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Transport & Livraison</h1>
            <p className="text-muted-foreground mt-1">
              Gestion des zones tarifaires et prestataires de transport
            </p>
          </div>
        </div>

        <Tabs defaultValue="zones" className="space-y-4">
          <TabsList>
            <TabsTrigger value="zones" className="gap-2">
              <MapPin className="h-4 w-4" />
              Zones de Livraison
            </TabsTrigger>
            <TabsTrigger value="prestataires" className="gap-2">
              <Truck className="h-4 w-4" />
              Prestataires
            </TabsTrigger>
          </TabsList>

          {/* Zones Tab */}
          <TabsContent value="zones">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Tarification par Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {zones.map((zone) => (
                      <Card
                        key={zone.id}
                        className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors"
                      >
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                        <CardContent className="pt-4 pl-5">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant="outline" className="mb-2 font-mono">
                                Zone {zone.code_zone}
                              </Badge>
                              <h3 className="font-semibold">{zone.nom_zone}</h3>
                              <p className="text-sm text-muted-foreground">{zone.description}</p>
                            </div>
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingZone(zone);
                                  setEditPrix(zone.prix_livraison_m3.toString());
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="mt-4 p-3 rounded-lg bg-muted/50">
                            <div className="text-xs text-muted-foreground">Prix Livraison</div>
                            <div className="text-2xl font-bold font-mono text-primary">
                              {zone.prix_livraison_m3.toLocaleString()} DH
                              <span className="text-sm font-normal text-muted-foreground">/m³</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prestataires Tab */}
          <TabsContent value="prestataires">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Prestataires de Transport
                </CardTitle>
                {canManage && (
                  <Button onClick={() => setAddPrestataireOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau Prestataire
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : prestataires.length === 0 ? (
                  <div className="text-center py-12">
                    <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucun prestataire enregistré</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Prestataire</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Tarif Base</TableHead>
                        <TableHead>Note Service</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prestataires.map((prest) => (
                        <TableRow key={prest.id}>
                          <TableCell className="font-mono">{prest.code_prestataire}</TableCell>
                          <TableCell className="font-medium">{prest.nom_prestataire}</TableCell>
                          <TableCell>
                            {prest.contact_nom && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-3 w-3 text-muted-foreground" />
                                {prest.contact_nom}
                              </div>
                            )}
                            {prest.contact_telephone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {prest.contact_telephone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {prest.tarif_base_m3.toLocaleString()} DH/m³
                          </TableCell>
                          <TableCell>{renderStars(prest.note_service)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Zone Price Dialog */}
      <Dialog open={!!editingZone} onOpenChange={() => setEditingZone(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le Prix - Zone {editingZone?.code_zone}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Zone</Label>
              <p className="text-sm text-muted-foreground">{editingZone?.nom_zone}</p>
            </div>
            <div className="space-y-2">
              <Label>Prix Livraison (DH/m³)</Label>
              <Input
                type="number"
                step="0.01"
                value={editPrix}
                onChange={(e) => setEditPrix(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingZone(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveZonePrix} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Prestataire Dialog */}
      <Dialog open={addPrestataireOpen} onOpenChange={setAddPrestataireOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau Prestataire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={prestataireForm.code_prestataire}
                  onChange={(e) => setPrestataireForm(f => ({ ...f, code_prestataire: e.target.value }))}
                  placeholder="PREST-004"
                />
              </div>
              <div className="space-y-2">
                <Label>Tarif Base (DH/m³) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={prestataireForm.tarif_base_m3}
                  onChange={(e) => setPrestataireForm(f => ({ ...f, tarif_base_m3: e.target.value }))}
                  placeholder="45"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nom du Prestataire *</Label>
              <Input
                value={prestataireForm.nom_prestataire}
                onChange={(e) => setPrestataireForm(f => ({ ...f, nom_prestataire: e.target.value }))}
                placeholder="Transport ABC SARL"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact</Label>
                <Input
                  value={prestataireForm.contact_nom}
                  onChange={(e) => setPrestataireForm(f => ({ ...f, contact_nom: e.target.value }))}
                  placeholder="Nom du contact"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={prestataireForm.contact_telephone}
                  onChange={(e) => setPrestataireForm(f => ({ ...f, contact_telephone: e.target.value }))}
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note Service (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={prestataireForm.note_service}
                onChange={(e) => setPrestataireForm(f => ({ ...f, note_service: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPrestataireOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddPrestataire} disabled={addingPrestataire}>
              {addingPrestataire ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
