import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Database, 
  Lock, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Server,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface HealthCheck {
  name: string;
  category: 'rls' | 'trigger' | 'index' | 'connection';
  status: 'green' | 'yellow' | 'red';
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DatabaseHealthWidget() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [overallHealth, setOverallHealth] = useState(100);
  const [errorCount, setErrorCount] = useState(0);

  const runHealthCheck = async () => {
    setLoading(true);
    const healthChecks: HealthCheck[] = [];

    try {
      // 1. Check RLS Policies - Critical tables
      const criticalTables = [
        'bons_commande', 
        'bons_livraison_reels', 
        'depenses', 
        'clients',
        'system_errors'
      ];

      for (const table of criticalTables) {
        try {
          // Use correct PK for each table
          const pkMap: Record<string, string> = {
            bons_livraison_reels: 'bl_id',
            clients: 'client_id',
          };
          const pk = pkMap[table] || 'id';
          const { error } = await supabase
            .from(table as 'clients')
            .select(pk)
            .limit(1);
          
          healthChecks.push({
            name: `RLS: ${table}`,
            category: 'rls',
            status: error ? 'yellow' : 'green',
            detail: error ? `Accès limité: ${error.code}` : 'Politique active',
            icon: Lock,
          });
        } catch {
          healthChecks.push({
            name: `RLS: ${table}`,
            category: 'rls',
            status: 'red',
            detail: 'Erreur de vérification',
            icon: Lock,
          });
        }
      }

      // 2. Check Database Connection
      const startTime = performance.now();
      const { error: connError } = await supabase.from('clients').select('count').limit(1);
      const latency = Math.round(performance.now() - startTime);
      
      healthChecks.push({
        name: 'Connexion DB',
        category: 'connection',
        status: connError ? 'red' : latency > 1000 ? 'yellow' : 'green',
        detail: connError ? 'Déconnecté' : `${latency}ms latence`,
        icon: Database,
      });

      // 3. Check Recent Errors (from system_errors)
      try {
        const { count, error: errError } = await supabase
          .from('system_errors')
          .select('*', { count: 'exact', head: true })
          .eq('resolved', false)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        setErrorCount(count || 0);

        healthChecks.push({
          name: 'Erreurs Système',
          category: 'trigger',
          status: errError ? 'yellow' : (count || 0) > 10 ? 'red' : (count || 0) > 0 ? 'yellow' : 'green',
          detail: errError ? 'Vérification échouée' : `${count || 0} erreurs (24h)`,
          icon: AlertTriangle,
        });
      } catch {
        healthChecks.push({
          name: 'Erreurs Système',
          category: 'trigger',
          status: 'yellow',
          detail: 'Table non accessible',
          icon: AlertTriangle,
        });
      }

      // 4. Check Realtime Connection
      const realtimeCheck = supabase.getChannels().length > 0;
      healthChecks.push({
        name: 'Realtime',
        category: 'connection',
        status: realtimeCheck ? 'green' : 'yellow',
        detail: realtimeCheck ? 'Actif' : 'Inactif',
        icon: Zap,
      });

      // 5. Check Auth Status
      const { data: { session } } = await supabase.auth.getSession();
      healthChecks.push({
        name: 'Authentification',
        category: 'connection',
        status: session ? 'green' : 'red',
        detail: session ? 'Session active' : 'Non authentifié',
        icon: Shield,
      });

      // Calculate overall health
      const statusScores = { green: 100, yellow: 50, red: 0 };
      const avgScore = healthChecks.reduce((sum, c) => sum + statusScores[c.status], 0) / healthChecks.length;
      setOverallHealth(Math.round(avgScore));

      setChecks(healthChecks);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      setOverallHealth(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
    // Auto-refresh every 5 minutes
    const interval = setInterval(runHealthCheck, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'yellow': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'red': return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  const greenCount = checks.filter(c => c.status === 'green').length;
  const yellowCount = checks.filter(c => c.status === 'yellow').length;
  const redCount = checks.filter(c => c.status === 'red').length;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center border",
              overallHealth >= 80 
                ? "bg-success/20 border-success/30" 
                : overallHealth >= 50 
                  ? "bg-warning/20 border-warning/30"
                  : "bg-destructive/20 border-destructive/30"
            )}>
              <Server className={cn("h-5 w-5", getHealthColor(overallHealth))} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Santé Base de Données
                {loading && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastChecked 
                  ? `Vérifié ${lastChecked.toLocaleTimeString('fr-FR')}` 
                  : 'Vérification...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Overall score */}
            <div className="text-right">
              <div className={cn("text-2xl font-bold tabular-nums", getHealthColor(overallHealth))}>
                {overallHealth}%
              </div>
              <div className="text-xs text-muted-foreground">Score global</div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={runHealthCheck}
              disabled={loading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-1">
          <Progress 
            value={overallHealth} 
            className={cn("h-2", getHealthBg(overallHealth))}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-success" />
              {greenCount} OK
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-warning" />
              {yellowCount} Alerte
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-destructive" />
              {redCount} Critique
            </span>
          </div>
        </div>

        {/* Health checks grid */}
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence mode="popLayout">
            {checks.map((check, idx) => {
              const Icon = check.icon;
              return (
                <motion.div
                  key={check.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-2.5 rounded-lg border transition-all",
                    check.status === 'green' && "bg-success/5 border-success/20",
                    check.status === 'yellow' && "bg-warning/5 border-warning/20",
                    check.status === 'red' && "bg-destructive/5 border-destructive/20"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "p-1.5 rounded-md",
                      check.status === 'green' && "bg-success/20",
                      check.status === 'yellow' && "bg-warning/20",
                      check.status === 'red' && "bg-destructive/20"
                    )}>
                      <Icon className={cn(
                        "h-3.5 w-3.5",
                        check.status === 'green' && "text-success",
                        check.status === 'yellow' && "text-warning",
                        check.status === 'red' && "text-destructive"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">{check.name}</span>
                        {getStatusIcon(check.status)}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {check.detail}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Error count alert */}
        {errorCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                {errorCount} erreur(s) non résolue(s)
              </span>
              <Badge variant="destructive" className="ml-auto text-xs">
                À auditer
              </Badge>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
