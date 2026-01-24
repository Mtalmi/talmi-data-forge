import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Truck, Navigation2, Phone, User, MapPin, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientLiveMapProps {
  truckId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  zoneName: string | null;
}

export function ClientLiveMap({
  truckId,
  driverName,
  driverPhone,
  zoneName,
}: ClientLiveMapProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Simulate truck movement animation
    const interval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!truckId) return null;

  return (
    <div className="p-4 bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-amber-500/20 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-amber-400/80 flex items-center gap-2">
          <Navigation2 className="h-4 w-4 animate-pulse" />
          Position en Direct
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>EN ROUTE</span>
        </div>
      </div>

      {/* Stylized Map Visualization */}
      <div className="relative h-40 bg-gradient-to-br from-gray-950 to-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-500/30" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Animated Route Line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
          <path
            d="M 20,80 Q 60,20 100,50 T 180,30"
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            className="drop-shadow-lg"
          />
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset={isAnimating ? "60%" : "40%"} stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Start Point - Central */}
        <div className="absolute left-[10%] bottom-[20%] flex flex-col items-center">
          <div className="h-4 w-4 rounded-full bg-gray-600 border-2 border-gray-500" />
          <span className="text-[8px] text-gray-500 mt-1">Centrale</span>
        </div>

        {/* End Point - Destination */}
        <div className="absolute right-[10%] top-[25%] flex flex-col items-center">
          <div className="h-4 w-4 rounded-full bg-amber-500 border-2 border-amber-400 animate-pulse" />
          <span className="text-[8px] text-amber-400 mt-1">{zoneName || 'Chantier'}</span>
        </div>

        {/* Truck Marker - Animated Position */}
        <div 
          className={cn(
            "absolute transition-all duration-1000 ease-in-out",
            isAnimating ? "left-[55%] top-[45%]" : "left-[50%] top-[50%]"
          )}
        >
          <div className="relative">
            <div className="absolute -inset-3 bg-amber-500/30 rounded-full animate-ping" />
            <div className="relative h-8 w-8 rounded-full bg-amber-500 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/50">
              <Truck className="h-4 w-4 text-black" />
            </div>
          </div>
        </div>
      </div>

      {/* Driver Info */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {driverName || 'Chauffeur'}
            </p>
            <p className="text-xs text-gray-500 font-mono">{truckId}</p>
          </div>
        </div>
        {driverPhone && (
          <a
            href={`tel:${driverPhone}`}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm hover:bg-emerald-500/20 transition-colors"
          >
            <Phone className="h-4 w-4" />
            <span>Appeler</span>
          </a>
        )}
      </div>
    </div>
  );
}
