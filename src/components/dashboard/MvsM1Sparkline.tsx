import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface MvsM1SparklineProps {
  className?: string;
}

interface DailyData {
  day: number;
  current: number;
  previous: number;
}

function MiniSparkline({ data, color, label, currentTotal, prevTotal }: {
  data: DailyData[];
  color: string;
  label: string;
  currentTotal: string;
  prevTotal: string;
}) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.flatMap(d => [d.current, d.previous]), 1);
  const width = 120;
  const height = 32;

  const toPath = (values: number[]) => {
    return values.map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * width;
      const y = height - (v / maxVal) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const currentPath = toPath(data.map(d => d.current));
  const prevPath = toPath(data.map(d => d.previous));

  const trend = prevTotal !== '0' ? (((parseFloat(currentTotal.replace(/[^0-9.-]/g, '')) - parseFloat(prevTotal.replace(/[^0-9.-]/g, ''))) / parseFloat(prevTotal.replace(/[^0-9.-]/g, ''))) * 100) : 0;

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/30">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-sm font-bold font-mono">{currentTotal}</span>
          <span className="text-[10px] text-muted-foreground">vs {prevTotal}</span>
        </div>
        {trend !== 0 && !isNaN(trend) && (
          <span className={cn(
            'text-[10px] font-medium',
            trend > 0 ? 'text-success' : 'text-destructive'
          )}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      <svg width={width} height={height} className="flex-shrink-0">
        <path d={prevPath} fill="none" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <path d={currentPath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function MvsM1Sparkline({ className }: MvsM1SparklineProps) {
  const [volumeData, setVolumeData] = useState<DailyData[]>([]);
  const [caData, setCaData] = useState<DailyData[]>([]);
  const [volumeTotals, setVolumeTotals] = useState({ current: '0', previous: '0' });
  const [caTotals, setCaTotals] = useState({ current: '0', previous: '0' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const currentStart = startOfMonth(now);
        const currentEnd = endOfMonth(now);
        const prevStart = startOfMonth(subMonths(now, 1));
        const prevEnd = endOfMonth(subMonths(now, 1));

        const [{ data: currentBLs }, { data: prevBLs }, { data: currentFact }, { data: prevFact }] = await Promise.all([
          supabase.from('bons_livraison_reels').select('date_livraison, volume_m3')
            .gte('date_livraison', format(currentStart, 'yyyy-MM-dd'))
            .lte('date_livraison', format(currentEnd, 'yyyy-MM-dd')),
          supabase.from('bons_livraison_reels').select('date_livraison, volume_m3')
            .gte('date_livraison', format(prevStart, 'yyyy-MM-dd'))
            .lte('date_livraison', format(prevEnd, 'yyyy-MM-dd')),
          supabase.from('factures').select('date_facture, total_ht')
            .gte('date_facture', format(currentStart, 'yyyy-MM-dd'))
            .lte('date_facture', format(currentEnd, 'yyyy-MM-dd')),
          supabase.from('factures').select('date_facture, total_ht')
            .gte('date_facture', format(prevStart, 'yyyy-MM-dd'))
            .lte('date_facture', format(prevEnd, 'yyyy-MM-dd')),
        ]);

        // Aggregate by day of month
        const today = now.getDate();
        const daysToShow = Math.min(today, 31);
        
        const volData: DailyData[] = [];
        const caDataArr: DailyData[] = [];
        let curVolTotal = 0, prevVolTotal = 0, curCaTotal = 0, prevCaTotal = 0;

        for (let d = 1; d <= daysToShow; d++) {
          const dayStr = d.toString().padStart(2, '0');
          
          const curVol = (currentBLs || [])
            .filter(bl => new Date(bl.date_livraison).getDate() === d)
            .reduce((s, bl) => s + (bl.volume_m3 || 0), 0);
          const prevVol = (prevBLs || [])
            .filter(bl => new Date(bl.date_livraison).getDate() === d)
            .reduce((s, bl) => s + (bl.volume_m3 || 0), 0);

          curVolTotal += curVol;
          prevVolTotal += prevVol;
          volData.push({ day: d, current: curVolTotal, previous: prevVolTotal });

          const curCa = (currentFact || [])
            .filter(f => new Date(f.date_facture).getDate() === d)
            .reduce((s, f) => s + (f.total_ht || 0), 0);
          const prevCa = (prevFact || [])
            .filter(f => new Date(f.date_facture).getDate() === d)
            .reduce((s, f) => s + (f.total_ht || 0), 0);

          curCaTotal += curCa;
          prevCaTotal += prevCa;
          caDataArr.push({ day: d, current: curCaTotal, previous: prevCaTotal });
        }

        setVolumeData(volData);
        setCaData(caDataArr);
        setVolumeTotals({ current: `${curVolTotal.toFixed(0)} m³`, previous: `${prevVolTotal.toFixed(0)} m³` });
        setCaTotals({ current: `${(curCaTotal / 1000).toFixed(1)}K`, previous: `${(prevCaTotal / 1000).toFixed(1)}K` });
      } catch (err) {
        console.error('MvsM1 error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={cn('space-y-2 animate-pulse', className)}>
        <div className="h-16 rounded-lg bg-muted/30" />
        <div className="h-16 rounded-lg bg-muted/30" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        📊 M vs M-1
        <span className="text-[10px] font-normal normal-case">(cumulatif jour par jour)</span>
      </h4>
      <MiniSparkline
        data={volumeData}
        color="hsl(var(--primary))"
        label="Volume cumulé"
        currentTotal={volumeTotals.current}
        prevTotal={volumeTotals.previous}
      />
      <MiniSparkline
        data={caData}
        color="hsl(var(--success))"
        label="CA cumulé"
        currentTotal={caTotals.current}
        prevTotal={caTotals.previous}
      />
    </div>
  );
}
