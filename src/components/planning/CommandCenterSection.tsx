import { useState } from 'react';
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
  demoMode?: boolean;
}

export function CommandCenterSection({ bons, camions, demoMode = false }: CommandCenterSectionProps) {
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
      <div className="overflow-hidden transition-all duration-300 rounded-2xl" style={{ background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: '1px solid #1E2D4A' }}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "flex flex-col space-y-1.5 p-5 sm:p-6 cursor-pointer transition-all duration-200",
            "hover:bg-primary/5",
            isOpen && "border-b border-primary/10"
          )}>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  {/* Gold ALL CAPS header matching TBOS pattern */}
                  <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#D4A843' }}>CENTRE DE COMMANDE</span>
                  {!isOpen && (
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="secondary" className="gap-1 bg-emerald-400/10 text-emerald-400 border-emerald-400/20">
                        <Activity className="h-3 w-3" />
                        {totalActive} actifs
                      </Badge>
                      <Badge variant="secondary" className="gap-1 bg-blue-400/10 text-blue-400 border-blue-400/20">
                        <Truck className="h-3 w-3" />
                        {assignedTrucks} toupies
                      </Badge>
                      <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        <TrendingUp className="h-3 w-3" />
                        {totalDelivered} livrés
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.4), transparent 80%)' }} />
                </div>
              </div>
              
              <div className={cn(
                "p-2 rounded-lg transition-all",
                isOpen ? "bg-white/[0.05] rotate-180" : "bg-white/[0.03]"
              )}>
                <ChevronDown className="h-5 w-5 text-white/40 transition-transform" />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="space-y-6 pt-6 p-5 sm:p-6 pt-0">
            {/* Timeline Gantt View */}
            <div className="space-y-2">
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
              <div>
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
                  demoPreset={demoMode ? 'planning' : undefined}
                />
              </div>
              
              <div>
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
                  overrideStats={demoMode ? { totalDelivered: 3, totalInProgress: 2, totalPending: 1, onTimeRate: 83 } : undefined}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
