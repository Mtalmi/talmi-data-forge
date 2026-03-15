import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

/**
 * Root-level error boundary — catches catastrophic crashes
 * that escape SectionErrorBoundary (provider failures, router crashes, etc.).
 * Shows TBOS-branded recovery screen instead of blank white page.
 */
export class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RootErrorBoundary] Catastrophic crash:', error, info.componentStack);
  }

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0d14',
          color: '#FFFFFF',
          fontFamily: MONO,
          padding: 32,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          {/* TBOS branding */}
          <div style={{ marginBottom: 32 }}>
            <span style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 6,
              color: '#D4A843',
            }}>
              TBOS
            </span>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#9CA3AF', marginTop: 4 }}>
              TALMI BETON OPERATING SYSTEM
            </div>
          </div>

          {/* Error icon */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            border: '2px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: 28,
          }}>
            ⚠
          </div>

          {/* Message */}
          <h1 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#EF4444' }}>
            TBOS a rencontré une erreur
          </h1>
          <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 24 }}>
            Une erreur inattendue est survenue. Vos données sont en sécurité.
            <br />
            Veuillez rafraîchir la page pour continuer.
          </p>

          {/* Error detail (collapsed) */}
          {this.state.error && (
            <details style={{ marginBottom: 24, textAlign: 'left' }}>
              <summary style={{
                fontSize: 11, color: '#9CA3AF', cursor: 'pointer',
                padding: '4px 0', userSelect: 'none',
              }}>
                Détails techniques
              </summary>
              <pre style={{
                fontSize: 10, color: '#EF4444', background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6,
                padding: 12, marginTop: 8, overflow: 'auto', maxHeight: 120,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {this.state.error.message}
              </pre>
            </details>
          )}

          {/* Reload button */}
          <button
            onClick={this.handleReload}
            style={{
              fontFamily: MONO,
              fontSize: 13,
              fontWeight: 600,
              padding: '10px 32px',
              borderRadius: 8,
              border: '1px solid #D4A843',
              background: '#D4A843',
              color: '#0F1629',
              cursor: 'pointer',
              transition: 'opacity 200ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            Rafraîchir la page
          </button>

          {/* Timestamp */}
          <div style={{ fontSize: 9, color: '#4B5563', marginTop: 16 }}>
            {new Date().toLocaleString('fr-FR')}
          </div>
        </div>
      </div>
    );
  }
}
