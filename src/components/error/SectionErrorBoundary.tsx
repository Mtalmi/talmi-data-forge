import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Label shown in the fallback UI */
  section?: string;
  /** Render a minimal inline fallback instead of a card */
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Section-level ErrorBoundary with French messaging and retry.
 * Wrap each independent section (KPI row, chart, table, agent card)
 * so a crash in one doesn't bring down the whole page.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SectionErrorBoundary:${this.props.section ?? 'unknown'}]`, error, info.componentStack);
  }

  handleRetry = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const label = this.props.section ?? 'Section';

    if (this.props.inline) {
      return (
        <span style={{ color: '#9CA3AF', fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 11 }}>
          — indisponible —
        </span>
      );
    }

    return (
      <div
        role="alert"
        style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: 8,
          padding: '20px 24px',
          textAlign: 'center',
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
        }}
      >
        <div style={{ fontSize: 13, color: '#EF4444', fontWeight: 600, marginBottom: 4 }}>
          {label} — temporairement indisponible
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>
          Une erreur est survenue dans ce composant.
        </div>
        <button
          onClick={this.handleRetry}
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 11,
            fontWeight: 600,
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid rgba(212,168,67,0.3)',
            background: 'transparent',
            color: '#D4A843',
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }
}
