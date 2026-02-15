import { Package, MapPin, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface ClientTrackingHeaderProps {
  bcId: string;
  clientName: string;
  formuleDesignation: string;
  volume: number;
  deliveryDate: string | null;
  deliveryTime: string | null;
  address: string | null;
  zone: string | null;
}

export function ClientTrackingHeader({
  bcId,
  clientName,
  formuleDesignation,
  volume,
  deliveryDate,
  deliveryTime,
  address,
  zone,
}: ClientTrackingHeaderProps) {
  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const formattedDate = deliveryDate 
    ? format(new Date(deliveryDate), 'EEEE d MMMM yyyy', { locale: dateLocale })
    : null;

  return (
    <div className="space-y-4">
      {/* Logo & Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-500/20 rounded-full">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-medium text-amber-400 tracking-widest uppercase">
            Suivi en Direct
          </span>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
          {clientName}
        </h1>
      </div>

      {/* Order Card */}
      <div className="p-4 bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-amber-500/20 rounded-2xl backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Package className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-white">{bcId}</p>
              <p className="text-sm text-amber-400/80">{formuleDesignation}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-400">{volume}</p>
            <p className="text-xs text-gray-500">m³</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {formattedDate && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Calendar className="h-4 w-4 text-amber-500/60" />
              <span className="capitalize">{formattedDate}</span>
            </div>
          )}
          {deliveryTime && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Clock className="h-4 w-4 text-amber-500/60" />
              <span>{deliveryTime}</span>
            </div>
          )}
          {(address || zone) && (
            <div className="col-span-2 flex items-start gap-2 text-sm text-gray-300">
              <MapPin className="h-4 w-4 text-amber-500/60 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{address || zone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
