import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PingResult {
  host: string;
  reachable: boolean;
  latency_ms: number | null;
  open_ports: { port: number; name: string; open: boolean }[];
  database_type: string | null;
  error?: string;
}

async function testPort(host: string, port: number, timeoutMs = 3000): Promise<{ open: boolean; latency: number | null }> {
  const start = performance.now();
  try {
    const conn = await Promise.race([
      Deno.connect({ hostname: host, port }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    const latency = Math.round(performance.now() - start);
    (conn as Deno.Conn).close();
    return { open: true, latency };
  } catch {
    return { open: false, latency: null };
  }
}

function detectDatabaseType(openPorts: { port: number; open: boolean }[]): string | null {
  const portMap: Record<number, string> = {
    1433: 'Microsoft SQL Server',
    3306: 'MySQL / MariaDB',
    5432: 'PostgreSQL',
    1521: 'Oracle DB',
    27017: 'MongoDB',
  };
  for (const p of openPorts) {
    if (p.open && portMap[p.port]) return portMap[p.port];
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { host, ports } = await req.json();

    if (!host || typeof host !== 'string') {
      return new Response(JSON.stringify({ error: 'host is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize host - strip protocol/path
    const cleanHost = host.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].trim();

    // Default ports to test
    const portsToTest: { port: number; name: string }[] = ports?.length
      ? ports.map((p: number) => ({ port: p, name: `Port ${p}` }))
      : [
          { port: 1433, name: 'SQL Server' },
          { port: 3306, name: 'MySQL' },
          { port: 5432, name: 'PostgreSQL' },
          { port: 80, name: 'HTTP' },
          { port: 443, name: 'HTTPS' },
          { port: 4840, name: 'OPC UA' },
          { port: 135, name: 'OPC DA (DCOM)' },
        ];

    // Test all ports in parallel
    const portResults = await Promise.all(
      portsToTest.map(async ({ port, name }) => {
        const result = await testPort(cleanHost, port);
        return { port, name, open: result.open, latency_ms: result.latency };
      })
    );

    const anyOpen = portResults.some(p => p.open);
    const fastestLatency = portResults
      .filter(p => p.latency_ms !== null)
      .sort((a, b) => (a.latency_ms ?? 999) - (b.latency_ms ?? 999))[0]?.latency_ms ?? null;

    const result: PingResult = {
      host: cleanHost,
      reachable: anyOpen,
      latency_ms: fastestLatency,
      open_ports: portResults,
      database_type: detectDatabaseType(portResults),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
