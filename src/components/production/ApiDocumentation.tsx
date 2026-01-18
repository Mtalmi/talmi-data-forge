import { useState } from 'react';
import { ChevronDown, ChevronRight, Code, Copy, Check, Server, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ApiDocumentationProps {
  className?: string;
}

export function ApiDocumentation({ className }: ApiDocumentationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const endpoints = [
    {
      id: 'sync',
      method: 'POST',
      path: '/api/v1/machine/sync',
      description: 'Synchroniser les données de production depuis la centrale à béton',
      request: `{
  "bl_id": "TB-240118-0001",
  "machine_id": "MC-001",
  "timestamp": "2024-01-18T14:30:00Z",
  "production_data": {
    "ciment_reel_kg": 2950,
    "adjuvant_reel_l": 17.5,
    "eau_reel_l": 1520,
    "sable_reel_kg": 5600,
    "gravette_reel_kg": 7200
  }
}`,
      response: `{
  "success": true,
  "bl_id": "TB-240118-0001",
  "deviations": {
    "ciment": { "percent": 1.2, "status": "ok" },
    "adjuvant": { "percent": 6.8, "status": "alert" }
  },
  "requires_justification": true
}`,
    },
    {
      id: 'status',
      method: 'GET',
      path: '/api/v1/machine/{machine_id}/status',
      description: 'Vérifier le statut de connexion d\'une centrale',
      request: null,
      response: `{
  "machine_id": "MC-001",
  "status": "online",
  "last_sync": "2024-01-18T14:30:00Z",
  "firmware_version": "2.4.1",
  "sensors": {
    "balance_ciment": "ok",
    "debitmetre_eau": "ok",
    "doseur_adjuvant": "ok"
  }
}`,
    },
    {
      id: 'batch',
      method: 'POST',
      path: '/api/v1/machine/batch-sync',
      description: 'Synchroniser plusieurs productions en lot',
      request: `{
  "machine_id": "MC-001",
  "batch": [
    { "bl_id": "TB-240118-0001", ... },
    { "bl_id": "TB-240118-0002", ... }
  ]
}`,
      response: `{
  "success": true,
  "processed": 2,
  "failed": 0,
  "results": [...]
}`,
    },
  ];

  return (
    <div className={cn('card-industrial', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Server className="h-5 w-5 text-muted-foreground" />
          <div className="text-left">
            <h3 className="font-semibold text-sm">Documentation API - Intégration Centrale</h3>
            <p className="text-xs text-muted-foreground">
              Endpoints pour la synchronisation automatique avec le logiciel de centrale
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded bg-warning/20 text-warning font-medium">
            En développement
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border p-4 space-y-6">
          {/* Authentication */}
          <div className="p-4 rounded bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Authentification</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Toutes les requêtes doivent inclure un header d'authentification:
            </p>
            <div className="relative">
              <pre className="p-3 rounded bg-background border border-border text-xs font-mono overflow-x-auto">
                {`Authorization: Bearer <API_KEY>
X-Machine-ID: <MACHINE_ID>`}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-7 w-7 p-0"
                onClick={() => copyToClipboard('Authorization: Bearer <API_KEY>\nX-Machine-ID: <MACHINE_ID>', 'auth')}
              >
                {copied === 'auth' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              Endpoints Disponibles
            </h4>

            {endpoints.map((endpoint) => (
              <div key={endpoint.id} className="border border-border rounded overflow-hidden">
                <div className="flex items-center gap-3 p-3 bg-muted/30">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-bold',
                      endpoint.method === 'GET' ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'
                    )}
                  >
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono">{endpoint.path}</code>
                </div>
                <div className="p-3 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-3">{endpoint.description}</p>
                  
                  {endpoint.request && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Request Body</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => copyToClipboard(endpoint.request!, `req-${endpoint.id}`)}
                        >
                          {copied === `req-${endpoint.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <pre className="p-3 rounded bg-background border border-border text-xs font-mono overflow-x-auto">
                        {endpoint.request}
                      </pre>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Response</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => copyToClipboard(endpoint.response, `res-${endpoint.id}`)}
                      >
                        {copied === `res-${endpoint.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <pre className="p-3 rounded bg-background border border-border text-xs font-mono overflow-x-auto">
                      {endpoint.response}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Integration Notes */}
          <div className="p-4 rounded bg-primary/5 border border-primary/20">
            <h4 className="font-semibold text-sm mb-2">Notes d'Intégration</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Les centrales doivent être enregistrées avant la première synchronisation</li>
              <li>Les données sont validées contre les formules théoriques en temps réel</li>
              <li>Les écarts &gt; 5% déclenchent automatiquement une alerte et bloquent le workflow</li>
              <li>Contactez l'équipe technique pour obtenir vos clés API de production</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
