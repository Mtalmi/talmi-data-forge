import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  FlaskConical,
  AlertTriangle,
  Eye,
  Clock,
  CheckCircle,
  Package,
  Loader2,
  ListChecks,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEmergencyBcNotifications } from '@/hooks/useEmergencyBcNotifications';
import { EmergencyBcActionItemsPanel } from './EmergencyBcActionItemsPanel';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EmergencyBc {
  id: string;
  bc_id: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  prix_vente_m3: number;
  total_ht: number;
  date_livraison_souhaitee: string | null;
  notes: string | null;
  created_at: string;
  statut: string;
  client?: { nom_client: string };
  formule?: { designation: string; ciment_kg_m3: number | null; adjuvant_l_m3: number | null };
}

interface EmergencyBcQualityViewProps {
  onNavigateToPlanning?: (date: string) => void;
}

export function EmergencyBcQualityView({ onNavigateToPlanning }: EmergencyBcQualityViewProps) {
  const { isResponsableTechnique, isCeo, isSuperviseur, canViewEmergencyBcs } = useAuth();
  const { productionNotifications } = useEmergencyBcNotifications();
  const [emergencyBcs, setEmergencyBcs] = useState<EmergencyBc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBc, setSelectedBc] = useState<EmergencyBc | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const fetchEmergencyBcs = async () => {
    if (!canViewEmergencyBcs) {
      setLoading(false);
      return;
    }

    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('bons_commande')
        .select(`
          id, bc_id, client_id, formule_id, volume_m3, prix_vente_m3, total_ht,
          date_livraison_souhaitee, notes, created_at, statut,
          client:clients!client_id(nom_client),
          formule:formules_theoriques!formule_id(designation, ciment_kg_m3, adjuvant_l_m3)
        `)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter for emergency BCs (those with URGENCE/EMERGENCY in notes)
      const emergencyOnly = (data || []).filter(bc => 
        bc.notes?.includes('[URGENCE/EMERGENCY')
      );
      
      setEmergencyBcs(emergencyOnly);
    } catch (error) {
      console.error('Error fetching emergency BCs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyBcs();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('emergency-bc-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bons_commande',
      }, () => {
        fetchEmergencyBcs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canViewEmergencyBcs]);

  const parseEmergencyReason = (notes: string | null): string => {
    if (!notes) return 'Non spécifié';
    const match = notes.match(/\[URGENCE\/EMERGENCY - [^\]]+\]\s*([^\n]+)/);
    return match ? match[1] : 'Non spécifié';
  };

  if (!canViewEmergencyBcs || emergencyBcs.length === 0) {
    return null;
  }

  // Only show to Resp. Technique primarily, but also CEO/Superviseur
  if (!isResponsableTechnique && !isCeo && !isSuperviseur) {
    return null;
  }

  return (
    <>
      <Card className="border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="relative">
              <Zap className="h-5 w-5 text-amber-500" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>
            Commandes d'Urgence (Nuit)
            <Badge variant="destructive" className="ml-auto gap-1">
              <AlertTriangle className="h-3 w-3" />
              {emergencyBcs.length} à vérifier
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            BC créés en urgence cette nuit - Vérification technique obligatoire avant départ camion
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BC</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Formule</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead>Raison Urgence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emergencyBcs.map((bc) => (
                  <TableRow key={bc.id} className="bg-amber-500/5 hover:bg-amber-500/10">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{bc.bc_id}</span>
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-500">
                          {format(parseISO(bc.created_at), 'HH:mm', { locale: fr })}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{bc.client?.nom_client || bc.client_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{bc.formule_id}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{bc.formule?.designation}</p>
                    </TableCell>
                    <TableCell className="text-right">{bc.volume_m3} m³</TableCell>
                    <TableCell>
                      <p className="text-sm text-amber-700 max-w-[200px] truncate">
                        {parseEmergencyReason(bc.notes)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => {
                          setSelectedBc(bc);
                          setDetailOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        Vérifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog for Technical Review */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Vérification Technique - {selectedBc?.bc_id}
            </DialogTitle>
            <DialogDescription>
              Vérifiez que la formule sélectionnée est correcte avant le départ du premier camion.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBc && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details" className="gap-2">
                  <FlaskConical className="h-4 w-4" />
                  Détails BC
                </TabsTrigger>
                <TabsTrigger value="actions" className="gap-2">
                  <ListChecks className="h-4 w-4" />
                  Actions Production
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Emergency Info */}
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-amber-700">Commande Urgence</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Raison:</strong> {parseEmergencyReason(selectedBc.notes)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Créé le {format(parseISO(selectedBc.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>

                {/* Client & Formula Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="font-semibold">{selectedBc.client?.nom_client}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="font-semibold">{selectedBc.volume_m3} m³</p>
                  </div>
                </div>

                {/* Formula Technical Details */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Formule: {selectedBc.formule_id}</span>
                  </div>
                  <p className="text-sm mb-2">{selectedBc.formule?.designation}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Ciment:</span>{' '}
                      <span className="font-mono">{selectedBc.formule?.ciment_kg_m3 || '—'} kg/m³</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Adjuvant:</span>{' '}
                      <span className="font-mono">{selectedBc.formule?.adjuvant_l_m3 || '—'} L/m³</span>
                    </div>
                  </div>
                </div>

                {/* Verification Checklist */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Points de vérification:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Formule adaptée au type d'ouvrage
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Dosage ciment conforme
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Adjuvants appropriés
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setDetailOpen(false)}
                  >
                    Fermer
                  </Button>
                  {onNavigateToPlanning && selectedBc.date_livraison_souhaitee && (
                    <Button 
                      className="flex-1 gap-2"
                      onClick={() => {
                        setDetailOpen(false);
                        onNavigateToPlanning(selectedBc.date_livraison_souhaitee!);
                      }}
                    >
                      <Clock className="h-4 w-4" />
                      Voir Planning
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                {/* Find matching production notification for this BC */}
                {(() => {
                  const matchingNotification = productionNotifications.find(
                    n => n.bc_id === selectedBc.bc_id
                  );
                  
                  if (matchingNotification) {
                    return (
                      <EmergencyBcActionItemsPanel 
                        notificationId={matchingNotification.id}
                        bcId={selectedBc.bc_id}
                      />
                    );
                  }
                  
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <ListChecks className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucune action de production associée</p>
                      <p className="text-sm">Les actions seront créées après approbation du BC</p>
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}