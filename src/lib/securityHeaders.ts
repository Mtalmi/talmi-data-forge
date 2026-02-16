/**
 * TITANIUM SHIELD - Security Headers
 * 
 * Applies security meta tags for the SPA. Additional headers 
 * are set via the _headers file for the hosting layer.
 */

export function applySecurityHeaders() {
  // Prevent clickjacking via meta (backup for X-Frame-Options header)
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!existingCSP) {
    const csp = document.createElement('meta');
    csp.httpEquiv = 'Content-Security-Policy';
    csp.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://*.lovable.app",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    document.head.appendChild(csp);
  }

  // Referrer policy
  const existingReferrer = document.querySelector('meta[name="referrer"]');
  if (!existingReferrer) {
    const referrer = document.createElement('meta');
    referrer.name = 'referrer';
    referrer.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(referrer);
  }
}
