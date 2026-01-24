import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileSearch,
  AlertTriangle,
  RefreshCw,
  Clock,
  User,
  DollarSign,
  FlaskConical,
  FileText,
  ArrowRight,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ForensicAuditEntry {
  id: string;
  type: 'formule' | 'devis' | 'prix';
  action: string;
  description: string;
  old_value?: string;
  new_value?: string;
  changed_by?: string;
  changed_at: string;
  severity: 'info' | 'warning' | 'critical';
}

export function ForensicAuditFeed() {
  const [entries, setEntries] = useState<ForensicAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAuditEntries = useCallback(async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Fetch audit_superviseur entries related to formules/devis/prix changes
      const { data: auditLogs } = await supabase
        .from('audit_superviseur')
        .select('*')
        .or('table_name.ilike.%formule%,table_name.ilike.%devis%,table_name.ilike.%prix%,action.ilike.%PRICE%,action.ilike.%FORMULE%,action.ilike.%DEVIS%')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(30);

      const processedEntries: ForensicAuditEntry[] = [];

      auditLogs?.forEach((log: any) => {
        // Determine type based on table_name or action
        let type: 'formule' | 'devis' | 'prix' = 'formule';
        if (log.table_name?.toLowerCase().includes('devis') || log.action?.includes('DEVIS')) {
          type = 'devis';
        } else if (log.table_name?.toLowerCase().includes('prix') || log.action?.includes('PRICE')) {
          type = 'prix';
        }

        // Determine severity based on action
        let severity: 'info' | 'warning' | 'critical' = 'info';
        if (log.action?.includes('DELETE') || log.action?.includes('ROLLBACK')) {
          severity = 'critical';
        } else if (log.action?.includes('UPDATE') || log.action?.includes('MODIFY')) {
          severity = 'warning';
        }

        // Extract old/new values from changes JSON
        const changes = log.changes || {};
        let oldValue = '';
        let newValue = '';
        
        if (changes.prix_avant !== undefined || changes.prix_apres !== undefined) {
          oldValue = changes.prix_avant ? `${changes.prix_avant} DH` : '';
          newValue = changes.prix_apres ? `${changes.prix_apres} DH` : '';
        } else if (changes.before && changes.after) {
          oldValue = JSON.stringify(changes.before);
          newValue = JSON.stringify(changes.after);
        }

        processedEntries.push({
          id: log.id,
          type,
          action: log.action || 'MODIFICATION',
          description: log.notes || `${log.action} sur ${log.table_name}`,
          old_value: oldValue,
          new_value: newValue,
          changed_by: log.user_name,
          changed_at: log.created_at,
          severity,
        });
      });

      // Also fetch recent formules_theoriques changes directly
      const { data: formulesChanges } = await supabase
        .from('formules_theoriques')
        .select('id, nom_formule, updated_at')
        .gte('updated_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(10);

      formulesChanges?.forEach((formule: any) => {
        // Only add if not already in audit log
        const alreadyExists = processedEntries.some(e => e.id === formule.id);
        if (!alreadyExists) {
          processedEntries.push({
            id: `formule-${formule.id}`,
            type: 'formule',
            action: 'MISE À JOUR',
            description: `Formule "${formule.nom_formule}" modifiée`,
            changed_at: formule.updated_at,
            severity: 'info',
          });
        }
      });

      // Sort by date
      processedEntries.sort((a, b) => 
        new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
      );

      setEntries(processedEntries.slice(0, 20));
    } catch (error) {
      console.error('Error fetching forensic audit entries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditEntries();

    // Realtime subscription
    const channel = supabase
      .channel('forensic_audit')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_superviseur' },
        () => fetchAuditEntries()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'formules_theoriques' },
        () => fetchAuditEntries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAuditEntries]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAuditEntries();
    setRefreshing(false);
  };

  const getTypeIcon = (type: ForensicAuditEntry['type']) => {
    switch (type) {
      case 'formule':
        return <FlaskConical className="h-3.5 w-3.5" />;
      case 'devis':
        return <FileText className="h-3.5 w-3.5" />;
      case 'prix':
        return <DollarSign className="h-3.5 w-3.5" />;
    }
  };

  const getTypeLabel = (type: ForensicAuditEntry['type']) => {
    switch (type) {
      case 'formule':
        return 'Formule';
      case 'devis':
        return 'Devis';
      case 'prix':
        return 'Prix';
    }
  };

  const getSeverityColor = (severity: ForensicAuditEntry['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-l-destructive bg-destructive/5';
      case 'warning':
        return 'border-l-warning bg-warning/5';
      case 'info':
        return 'border-l-primary bg-primary/5';
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg border mb-2 animate-pulse">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <FileSearch className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Audit Forensique
            </CardTitle>
            <CardDescription className="text-xs">
              Modifications Formules, Devis & Prix (7 derniers jours)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {entries.filter(e => e.severity === 'critical').length > 0 && (
              <Badge variant="destructive" className="animate-pulse gap-1">
                <AlertTriangle className="h-3 w-3" />
                {entries.filter(e => e.severity === 'critical').length}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <Shield className="h-7 w-7 text-success" />
            </div>
            <p className="font-medium text-sm text-success">Aucune modification suspecte</p>
            <p className="text-xs text-muted-foreground">
              Pas de changements aux formules ou prix
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-2">
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "p-3 rounded-lg border-l-4 transition-all hover:shadow-sm",
                    getSeverityColor(entry.severity)
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "p-1.5 rounded-md",
                        entry.severity === 'critical' ? "bg-destructive/20 text-destructive" :
                        entry.severity === 'warning' ? "bg-warning/20 text-warning" :
                        "bg-primary/20 text-primary"
                      )}>
                        {getTypeIcon(entry.type)}
                      </span>
                      <div>
                        <p className="font-semibold text-xs">
                          {getTypeLabel(entry.type)} • {entry.action}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {format(parseISO(entry.changed_at), 'dd/MM HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[9px] shrink-0",
                        entry.severity === 'critical' && "border-destructive text-destructive",
                        entry.severity === 'warning' && "border-warning text-warning"
                      )}
                    >
                      {entry.severity === 'critical' ? 'CRITIQUE' : 
                       entry.severity === 'warning' ? 'ALERTE' : 'INFO'}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-foreground line-clamp-2 mb-1.5">
                    {entry.description}
                  </p>

                  {/* Value Changes */}
                  {(entry.old_value || entry.new_value) && (
                    <div className="flex items-center gap-2 text-[10px] p-1.5 rounded bg-muted/50">
                      {entry.old_value && (
                        <span className="text-destructive line-through font-mono">
                          {entry.old_value}
                        </span>
                      )}
                      {entry.old_value && entry.new_value && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                      {entry.new_value && (
                        <span className="text-success font-mono font-semibold">
                          {entry.new_value}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(parseISO(entry.changed_at), { locale: fr, addSuffix: true })}
                    </span>
                    {entry.changed_by && (
                      <span className="flex items-center gap-1">
                        <User className="h-2.5 w-2.5" />
                        {entry.changed_by}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
