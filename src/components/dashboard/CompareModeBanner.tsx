const M = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

interface CompareModeToggleProps {
  active: boolean;
  onToggle: () => void;
  period?: string;
}

export function CompareModeToggle({ active, onToggle }: CompareModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      style={{
        fontFamily: M, fontSize: 11, fontWeight: 600,
        color: active ? '#0F1629' : '#D4A843',
        background: active ? '#D4A843' : 'transparent',
        border: '1px solid rgba(212,168,67,0.4)',
        borderRadius: 6, padding: '5px 12px',
        cursor: 'pointer', transition: 'all 200ms',
        display: 'flex', alignItems: 'center', gap: 6,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.1)';
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      📊 Comparer
    </button>
  );
}

interface CompareModeBannerProps {
  period: string;
  onDisable: () => void;
}

export function CompareModeBanner({ period, onDisable }: CompareModeBannerProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'rgba(212,168,67,0.08)',
        border: '1px solid rgba(212,168,67,0.15)',
        borderRadius: 6,
        marginBottom: 12,
      }}
    >
      <span style={{ fontFamily: M, fontSize: 11, color: '#D4A843', fontWeight: 600 }}>
        MODE COMPARAISON ACTIF — vs {period} précédents
      </span>
      <button
        onClick={onDisable}
        style={{
          fontFamily: M, fontSize: 10, color: '#9CA3AF',
          background: 'transparent', border: 'none',
          cursor: 'pointer', padding: '4px 8px',
          transition: 'color 150ms',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
      >
        Désactiver
      </button>
    </div>
  );
}
