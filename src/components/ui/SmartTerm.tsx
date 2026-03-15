import { useState, useRef, useEffect } from 'react';

const M = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

const TERMS: Record<string, { ma: string; eu: string; us: string }> = {
  'Affaissement':    { ma: 'Affaissement',     eu: 'Slump',          us: 'Slump (ASTM C143)' },
  'Toupie':          { ma: 'Toupie',            eu: 'Truck mixer',    us: 'Mixer truck' },
  'Bon de livraison':{ ma: 'BL',                eu: 'Delivery note',  us: 'Batch ticket' },
  'Éprouvette':      { ma: 'Éprouvette',        eu: 'Test specimen',  us: 'Test cylinder' },
  'Adjuvant':        { ma: 'Adjuvant',           eu: 'Admixture',     us: 'Admixture (ASTM C494)' },
  'Surestaries':     { ma: 'Surestaries',        eu: 'Demurrage',     us: 'Standby time' },
};

interface SmartTermProps {
  term: string;
  children?: React.ReactNode;
}

export function SmartTerm({ term, children }: SmartTermProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<'bottom' | 'top'>('bottom');
  const ref = useRef<HTMLSpanElement>(null);
  const data = TERMS[term];

  useEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos(rect.bottom + 100 > window.innerHeight ? 'top' : 'bottom');
    }
  }, [show]);

  if (!data) return <>{children || term}</>;

  return (
    <span
      ref={ref}
      style={{ position: 'relative', borderBottom: '1px dotted rgba(212,168,67,0.3)', cursor: 'help' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children || term}
      {show && (
        <span style={{
          position: 'absolute',
          [pos === 'bottom' ? 'top' : 'bottom']: '100%',
          left: '50%', transform: 'translateX(-50%)',
          [pos === 'bottom' ? 'marginTop' : 'marginBottom']: 6,
          background: '#1A2332', border: '1px solid rgba(212,168,67,0.2)',
          borderRadius: 6, padding: '8px 12px', zIndex: 300,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          fontFamily: M, fontSize: 11, whiteSpace: 'nowrap',
          display: 'flex', flexDirection: 'column', gap: 4,
          lineHeight: 1.5,
        }}>
          <span><span style={{ fontSize: 13 }}>🇲🇦</span> <span style={{ color: '#D4A843', fontWeight: 700 }}>{data.ma}</span></span>
          <span><span style={{ fontSize: 13 }}>🇪🇺</span> <span style={{ color: '#FFFFFF' }}>{data.eu}</span></span>
          <span><span style={{ fontSize: 13 }}>🇺🇸</span> <span style={{ color: '#FFFFFF' }}>{data.us}</span></span>
        </span>
      )}
    </span>
  );
}
