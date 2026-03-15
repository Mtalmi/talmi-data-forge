/**
 * Centralized webhook URLs for n8n integrations.
 * All external webhook references MUST use these constants.
 */
export const WEBHOOKS = {
  DEAL_SCORER: 'https://talmi.app.n8n.cloud/webhook/deal-scorer',
} as const;

/** Default timeout for webhook calls (15s) */
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Call a webhook with proper timeout, error handling, and abort support.
 * Returns parsed JSON on success, null on failure (never throws).
 */
export async function callWebhook<T = unknown>(
  url: string,
  body: Record<string, unknown>,
  options?: { timeoutMs?: number; signal?: AbortSignal }
): Promise<{ data: T | null; error: string | null }> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Chain external signal if provided
  if (options?.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      return { data: null, error: `Erreur serveur (${res.status})` };
    }

    const data = await res.json();
    return { data: data as T, error: null };
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { data: null, error: 'Délai d\'attente dépassé — réessayez plus tard' };
    }
    return { data: null, error: 'Service indisponible — réessayez plus tard' };
  }
}
