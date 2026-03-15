import { Moon } from 'lucide-react';
import { useState } from 'react';

export function ThemeToggle() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="relative flex items-center justify-center"
        style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#9CA3AF', border: 'none', cursor: 'default', opacity: 0.5 }}
        aria-label="Changer de thème"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Moon size={16} strokeWidth={1.5} />
      </button>
      {showTooltip && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          background: '#1A2332', border: '1px solid rgba(212,168,67,0.15)',
          borderRadius: 6, padding: '6px 10px', whiteSpace: 'nowrap', zIndex: 200,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11, color: '#9CA3AF',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          Thème sombre actif
        </div>
      )}
    </div>
  );
}
