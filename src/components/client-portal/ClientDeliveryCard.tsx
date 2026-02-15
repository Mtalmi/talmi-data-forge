import { Package, CheckCircle, Truck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

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

const STATUS_ICONS: Record<string, typeof Package> = {
  planification: Clock,
  production: Package,
  validation_technique: Package,
  en_livraison: Truck,
  livre: CheckCircle,
};

const STATUS_COLORS: Record<string, string> = {
  planification: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  production: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  validation_technique: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  en_livraison: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  livre: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

export function ClientDeliveryCard({
  delivery,
  isSelected,
  onSelect,
}: ClientDeliveryCardProps) {
  const { t } = useI18n();
  const cdc = t.clientDeliveryCard;
  const statusKey = delivery.workflow_status as keyof typeof cdc.statuses;
  const label = cdc.statuses[statusKey] || cdc.statuses.planification;
  const color = STATUS_COLORS[delivery.workflow_status] || STATUS_COLORS.planification;
  const Icon = STATUS_ICONS[delivery.workflow_status] || Clock;

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
          color
        )}>
          <Icon className="h-3 w-3" />
          <span>{label}</span>
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
          <span>{cdc.confirmed}</span>
        </div>
      )}
    </button>
  );
}