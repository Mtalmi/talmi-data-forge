import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Server,
  Database,
  Clock,
  Globe,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortResult {
  port: number;
  name: string;
  open: boolean;
  latency_ms: number | null;
}

interface PingResult {
  host: string;
  reachable: boolean;
  latency_ms: number | null;
  open_ports: PortResult[];
  database_type: string | null;
  error?: string;
}

export default function WS7Discovery() {
  const [host, setHost] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<PingResult | null>(null);

  const handleTest = async () => {
    if (!host.trim()) {
      toast.error('Veuillez entrer une adresse IP ou un nom d\'hôte');
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ws7-ping', {
        body: { host: host.trim() },
      });

      if (error) throw error;
      setResult(data as PingResult);

      if (data.reachable) {
        toast.success(`Serveur ${data.host} accessible`);
      } else {
        toast.warning(`Serveur ${data.host} injoignable`);
      }
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <Search className="h-7 w-7 text-primary" />
            Découvrir WS7
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tester la connectivité réseau vers un serveur WS7 ou automate
          </p>
        </div>

        {/* Input */}
        <div className="card-industrial p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Adresse IP ou nom d'hôte</Label>
            <div className="flex gap-3">
              <Input
                placeholder="192.168.1.100 ou ws7-server.local"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTest()}
                className="font-mono"
              />
              <Button onClick={handleTest} disabled={testing} className="min-w-[160px]">
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test en cours…
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Tester Connexion
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Server Status */}
            <div className={cn(
              'card-industrial p-6 border-l-4',
              result.reachable ? 'border-l-emerald-500' : 'border-l-destructive'
            )}>
              <div className="flex items-center gap-3 mb-4">
                {result.reachable ? (
                  <Wifi className="h-6 w-6 text-emerald-500" />
                ) : (
                  <WifiOff className="h-6 w-6 text-destructive" />
                )}
                <div>
                  <h2 className="text-lg font-semibold">
                    {result.reachable ? 'Serveur Accessible' : 'Serveur Injoignable'}
                  </h2>
                  <p className="text-sm text-muted-foreground font-mono">{result.host}</p>
                </div>
                {result.latency_ms !== null && (
                  <div className="ml-auto text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Latence
                    </div>
                    <p className={cn(
                      'text-xl font-bold font-mono',
                      result.latency_ms < 50 ? 'text-emerald-500' :
                      result.latency_ms < 200 ? 'text-amber-500' : 'text-destructive'
                    )}>
                      {result.latency_ms} ms
                    </p>
                  </div>
                )}
              </div>

              {/* Database Type */}
              {result.database_type && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Database className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Base de données détectée:</span>
                  <span className="text-sm font-semibold text-primary">{result.database_type}</span>
                </div>
              )}
            </div>

            {/* Port Scan */}
            <div className="card-industrial p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
                <Server className="h-4 w-4" />
                Ports Scannés
              </h3>
              <div className="grid gap-2">
                {result.open_ports.map((p) => (
                  <div
                    key={p.port}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border transition-colors',
                      p.open
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-muted/30 border-border/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {p.open ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground/50" />
                      )}
                      <div>
                        <span className="font-mono font-medium text-sm">{p.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">:{p.port}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {p.open ? (
                        <span className="text-xs font-medium text-emerald-500">
                          OUVERT {p.latency_ms !== null && `• ${p.latency_ms}ms`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">FERMÉ</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
