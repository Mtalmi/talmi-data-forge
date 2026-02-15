import { Package, CheckCircle, Truck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';


interface DeliveryData {
  bl_id: string;
  workflow_status: string;
  volume_m3: number;
  heure_prevue: string | null;
  client_confirmed_at: string | null;
}

interface ClientDeliveryCardProps {
  delivery: DeliveryData;
  isSelected: boolean;
  onSelect: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: typeof Package }> = {
  planification: { color: 'text-gray-400 bg-gray-500/10 border-gray-500/30', label: 'Préparation', icon: Clock },
  production: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', label: 'Production', icon: Package },
  validation_technique: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', label: 'Validation', icon: Package },
  en_livraison: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'En Route', icon: Truck },
  livre: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Livré', icon: CheckCircle },
};

export function ClientDeliveryCard({
  delivery,
  isSelected,
  onSelect,
}: ClientDeliveryCardProps) {
  const config = STATUS_CONFIG[delivery.workflow_status] || STATUS_CONFIG.planification;
  const Icon = config.icon;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "p-3 rounded-xl border text-left transition-all",
        isSelected 
          ? "bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30"
          : "bg-gray-900/50 border-gray-800 hover:border-gray-700"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-gray-400">
          {delivery.bl_id.split('-').pop()}
        </span>
        <div className={cn(
          "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border",
          config.color
        )}>
          <Icon className="h-3 w-3" />
          <span>{config.label}</span>
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold text-white">{delivery.volume_m3}</span>
        <span className="text-xs text-gray-500">m³</span>
      </div>
      {delivery.heure_prevue && (
        <p className="text-[10px] text-gray-500 mt-1">
          {delivery.heure_prevue}
        </p>
      )}
      {delivery.client_confirmed_at && (
        <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
          <CheckCircle className="h-3 w-3" />
          <span>Confirmé</span>
        </div>
      )}
    </button>
  );
}
