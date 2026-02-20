import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Sun, Cloud, CloudRain, Snowflake, Factory, Shield } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'cold';
  city: string;
}

interface EfficiencyData {
  percentage: number;
  status: 'optimal' | 'good' | 'attention';
}

export function HawaiiGreeting() {
  const { user, isCeo } = useAuth();
  const { t } = useI18n();
  const [weather, setWeather] = useState<WeatherData>({ temp: 18, condition: 'sunny', city: 'Casablanca' });
  const [efficiency, setEfficiency] = useState<EfficiencyData>({ percentage: 85, status: 'optimal' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
    };
  }, []);

  useEffect(() => {
    const fetchEfficiency = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: totalBatches } = await supabase
          .from('production_batches')
          .select('*', { count: 'exact', head: true })
          .gte('entered_at', today.toISOString());
        const { count: okBatches } = await supabase
          .from('production_batches')
          .select('*', { count: 'exact', head: true })
          .gte('entered_at', today.toISOString())
          .eq('quality_status', 'ok');
        const total = totalBatches || 0;
        const ok = okBatches || 0;
        const pct = total > 0 ? Math.round((ok / total) * 100) : 100;
        setEfficiency({
          percentage: pct,
          status: pct >= 95 ? 'optimal' : pct >= 80 ? 'good' : 'attention',
        });
      } catch (error) {
        console.error('Error fetching efficiency:', error);
      }
    };
    fetchEfficiency();
  }, []);

  useEffect(() => {
    const hour = currentTime.getHours();
    const temps = [14, 13, 13, 12, 12, 13, 15, 17, 19, 21, 23, 25, 26, 27, 27, 26, 24, 22, 20, 18, 17, 16, 15, 14];
    const temp = temps[hour] || 18;
    let condition: WeatherData['condition'] = 'sunny';
    if (temp < 15) condition = 'cold';
    else if (hour >= 6 && hour <= 10) condition = 'cloudy';
    else if (hour >= 18) condition = 'cloudy';
    setWeather({ temp, condition, city: 'Casablanca' });
  }, [currentTime]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return t.greeting.morning;
    if (hour >= 12 && hour < 18) return t.greeting.afternoon;
    if (hour >= 18 && hour < 22) return t.greeting.evening;
    return t.greeting.night;
  };

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case 'sunny': return <Sun className="h-4 w-4 text-primary animate-pulse-slow" />;
      case 'cloudy': return <Cloud className="h-4 w-4 text-muted-foreground" />;
      case 'rainy': return <CloudRain className="h-4 w-4 text-blue-400" />;
      case 'cold': return <Snowflake className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getStatusMessage = () => {
    if (efficiency.status === 'optimal') return t.greeting.allUnderControl;
    if (efficiency.status === 'good') return t.greeting.stablePerformance;
    return t.greeting.attentionRequired;
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Master';
  const title = isCeo ? 'Master' : displayName.split(' ')[0];

  return (
    <div className={cn(
      'greeting-card relative overflow-hidden rounded-xl transition-all duration-1000 ease-out',
      'border border-primary/10 backdrop-blur-sm',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
    )}>
      <div className="absolute top-0 left-0 right-0 h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-shimmer" />
      </div>

      <div className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center">
              <Shield className="h-5 w-5 text-primary animate-pulse-slow" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                  {getGreeting()}, {title}.
                </span>
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  {getWeatherIcon()}
                  <span>{weather.city} • {weather.temp}°C</span>
                </span>
                <span className="hidden sm:inline text-primary/30">|</span>
                <span className="flex items-center gap-1.5">
                  <Factory className={cn(
                    'h-3.5 w-3.5',
                    efficiency.status === 'optimal' ? 'text-success' :
                    efficiency.status === 'good' ? 'text-warning' : 'text-destructive'
                  )} />
                  <span className={cn(
                    'status-dot',
                    efficiency.status === 'optimal' ? 'status-dot-green' :
                    efficiency.status === 'good' ? 'status-dot-yellow' : 'status-dot-red'
                  )} />
                  <span>
                    {t.greeting.plantRunning}{' '}
                    <span className={cn(
                      'font-mono font-bold',
                      efficiency.status === 'optimal' ? 'text-success' :
                      efficiency.status === 'good' ? 'text-warning' : 'text-destructive'
                    )}>
                      {efficiency.percentage}%
                    </span>
                    {' '}{t.greeting.efficiency}.
                  </span>
                </span>
              </p>
            </div>
          </div>

          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
            efficiency.status === 'optimal' 
              ? 'bg-success/10 text-success border border-success/20' 
              : efficiency.status === 'good'
                ? 'bg-warning/10 text-warning border border-warning/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20 animate-pulse'
          )}>
            <div className={cn(
              'h-2 w-2 rounded-full',
              efficiency.status === 'optimal' ? 'bg-success animate-pulse-slow' :
              efficiency.status === 'good' ? 'bg-warning' : 'bg-destructive animate-pulse'
            )} />
            <span>{getStatusMessage()}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
    </div>
  );
}
