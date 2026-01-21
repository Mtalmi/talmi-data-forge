import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Sparkles, Activity, Truck, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyTimeline } from './DailyTimeline';
import { FleetCapacityOptimizer } from './FleetCapacityOptimizer';
import { PerformanceKPIs } from './PerformanceKPIs';

interface BonLivraison {
  bl_id: string;
  bc_id: string | null;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  workflow_status: string;
  heure_prevue: string | null;
  camion_assigne: string | null;
  toupie_assignee: string | null;
  date_livraison: string;
  heure_depart_centrale: string | null;
  heure_retour_centrale: string | null;
  temps_rotation_minutes: number | null;
  clients?: { nom_client: string } | null;
}

interface Camion {
  id_camion: string;
  immatriculation: string | null;
  chauffeur: string | null;
  statut: string;
  capacite_m3: number | null;
  telephone_chauffeur?: string | null;
}

interface CommandCenterSectionProps {
  bons: BonLivraison[];
  camions: Camion[];
}

export function CommandCenterSection({ bons, camions }: CommandCenterSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  // Calculate summary stats for the header
  const totalActive = bons.filter(b => 
    ['production', 'en_chargement', 'en_livraison'].includes(b.workflow_status)
  ).length;
  
  const totalDelivered = bons.filter(b => b.workflow_status === 'livre').length;
  
  const assignedTrucks = new Set(
    bons.filter(b => b.camion_assigne || b.toupie_assignee)
      .map(b => b.camion_assigne || b.toupie_assignee)
  ).size;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "border-2 overflow-hidden transition-all duration-300",
        isOpen 
          ? "border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5" 
          : "border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5"
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className={cn(
            "cursor-pointer transition-all duration-200",
            "hover:bg-primary/5",
            isOpen && "border-b border-primary/10"
          )}>
            <CardTitle className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl transition-all duration-300",
                isOpen 
                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25" 
                  : "bg-primary/20"
              )}>
                <Sparkles className={cn("h-5 w-5", isOpen && "animate-pulse")} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">Centre de Commande</span>
                  {!isOpen && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <Activity className="h-3 w-3" />
                        {totalActive} actifs
                      </Badge>
                      <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
                        <Truck className="h-3 w-3" />
                        {assignedTrucks} camions
                      </Badge>
                      <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20">
                        <TrendingUp className="h-3 w-3" />
                        {totalDelivered} livrés
                      </Badge>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  Timeline, Capacité Flotte & Performance KPIs
                </p>
              </div>
              
              <div className={cn(
                "p-2 rounded-lg transition-all",
                isOpen ? "bg-primary/10 rotate-180" : "bg-muted"
              )}>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-6">
            {/* Timeline Gantt View */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Timeline Journalière
              </h3>
              <DailyTimeline 
                bons={bons.filter(b => !['annule', 'livre', 'facture', 'en_attente_validation'].includes(b.workflow_status)).map(b => ({
                  bl_id: b.bl_id,
                  client_id: b.client_id,
                  clients: b.clients,
                  heure_prevue: b.heure_prevue,
                  volume_m3: b.volume_m3,
                  workflow_status: b.workflow_status,
                  toupie_assignee: b.camion_assigne || b.toupie_assignee,
                }))}
              />
            </div>

            {/* Fleet & KPIs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Capacité Flotte
                </h3>
                <FleetCapacityOptimizer 
                  camions={camions.map(c => ({
                    id_camion: c.id_camion,
                    immatriculation: c.immatriculation,
                    chauffeur: c.chauffeur,
                    capacite_m3: c.capacite_m3,
                    statut: c.statut,
                  }))}
                  bons={bons.filter(b => b.camion_assigne || b.toupie_assignee).map(b => ({
                    bl_id: b.bl_id,
                    volume_m3: b.volume_m3,
                    toupie_assignee: b.camion_assigne || b.toupie_assignee,
                    workflow_status: b.workflow_status,
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Performance du Jour
                </h3>
                <PerformanceKPIs 
                  bons={bons.map(b => ({
                    bl_id: b.bl_id,
                    toupie_assignee: b.camion_assigne || b.toupie_assignee,
                    workflow_status: b.workflow_status,
                    heure_depart_centrale: b.heure_depart_centrale,
                    heure_retour_centrale: b.heure_retour_centrale,
                    temps_rotation_minutes: b.temps_rotation_minutes,
                    volume_m3: b.volume_m3,
                  }))}
                  camions={camions.map(c => ({
                    id_camion: c.id_camion,
                    chauffeur: c.chauffeur,
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
