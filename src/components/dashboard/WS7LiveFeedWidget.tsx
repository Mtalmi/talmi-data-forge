import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Factory, CheckCircle, Clock, AlertTriangle, Link2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { ar as arLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';

interface WS7Batch {
  id: string;
  batch_number: string;
  batch_datetime: string;
  client_name: string;
  formula: string;
  total_volume_m3: number;
  operator_name: string;
  link_status: string;
  link_confidence: number;
}

export function WS7LiveFeedWidget() {
  const { t, lang } = useI18n();
  const dateFnsLocale = lang === 'ar' ? arLocale : lang === 'fr' ? frLocale : enUS;
  const [batches, setBatches] = useState<WS7Batch[]>([]);
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [todayCount, setTodayCount] = useState(0);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];

    const [batchesRes, logRes, countRes] = await Promise.all([
      supabase
        .from('ws7_batches')
        .select('id, batch_number, batch_datetime, client_name, formula, total_volume_m3, operator_name, link_status, link_confidence')
        .order('batch_datetime', { ascending: false })
        .limit(5),
      supabase
        .from('ws7_import_log')
        .select('import_datetime')
        .order('import_datetime', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('ws7_batches')
        .select('id', { count: 'exact', head: true })
        .gte('batch_datetime', today + 'T00:00:00')
        .lte('batch_datetime', today + 'T23:59:59'),
    ]);

    setBatches(batchesRes.data || []);
    setLastImport(logRes.data?.import_datetime || null);
    setTodayCount(countRes.count || 0);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('ws7-live-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ws7_batches' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'auto_linked':
      case 'manual_linked':
        return <CheckCircle className="h-3 w-3 text-success" />;
      case 'pending':
        return <AlertTriangle className="h-3 w-3 text-warning" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Factory className="h-4 w-4 text-primary" />
          {t.ws7.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px] gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            {todayCount} {t.ws7.today}
          </Badge>
        </div>
      </div>

      {lastImport && (
        <p className="text-[10px] text-muted-foreground">
          {t.ws7.lastImport}: {format(new Date(lastImport), 'dd MMM HH:mm', { locale: dateFnsLocale })}
        </p>
      )}

      <div className="space-y-1.5">
        {batches.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">{t.ws7.noBatches}</p>
        ) : (
          batches.map(b => (
            <div key={b.id} className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2 text-xs">
              {statusIcon(b.link_status)}
              <span className="font-mono font-medium">#{b.batch_number}</span>
              <span className="text-muted-foreground truncate flex-1">{b.client_name}</span>
              <Badge variant="outline" className="text-[10px] font-mono">{b.formula}</Badge>
              <span className="font-mono">{b.total_volume_m3}m³</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
