import { useState, useRef, useEffect, ReactNode } from 'react';
import { useUnits } from '@/i18n/UnitContext';

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

const GLOSSARY: Record<string, { ma: string; eu: string; us: string }> = {
  'Affaissement': { ma: 'Affaissement', eu: 'Slump (EN)', us: 'Slump (ASTM C143)' },
  'Résistance 28j': { ma: 'Résistance 28j', eu: '28-day compressive strength', us: '28-day cylinder break' },
  'Ratio E/C': { ma: 'Rapport eau/ciment', eu: 'Water-cement ratio (w/c)', us: 'Water-cement ratio (w/c)' },
  'Bon de livraison': { ma: 'Bon de livraison', eu: 'Delivery note', us: 'Batch ticket / Load ticket' },
  'Toupie': { ma: 'Toupie', eu: 'Truck mixer', us: 'Ready-mix truck / Mixer truck' },
  'Centrale à béton': { ma: 'Centrale', eu: 'Batching plant', us: 'Batch plant / Ready-mix plant' },
  'Malaxeur': { ma: 'Malaxeur', eu: 'Mixer', us: 'Central mixer / Drum mixer' },
  'Éprouvette': { ma: 'Éprouvette', eu: 'Test specimen', us: 'Cylinder / Test cylinder' },
  'Adjuvant': { ma: 'Adjuvant', eu: 'Admixture', us: 'Admixture (ASTM C494)' },
  'Gravette': { ma: 'Gravette', eu: 'Coarse aggregate', us: 'Coarse aggregate / Gravel' },
  'Surestaries': { ma: 'Surestaries', eu: 'Demurrage', us: 'Standby time / Demurrage' },
};

interface SmartLabelProps {
  /** The term key — must match a GLOSSARY entry */
  term: string;
  /** Override display text (defaults to term) */
  children?: ReactNode;
}

export function SmartLabel({ term, children }: SmartLabelProps) {
  const entry = GLOSSARY[term];
  const { system } = useUnits();
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<'above' | 'below'>('above');
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos(rect.top < 160 ? 'below' : 'above');
    }
  }, [show]);

  if (!entry) return <>{children ?? term}</>;

  const markets: { id: 'ma' | 'eu' | 'us'; flag: string; value: string }[] = [
    { id: 'ma', flag: '🇲🇦', value: entry.ma },
    { id: 'eu', flag: '🇪🇺', value: entry.eu },
    { id: 'us', flag: '🇺🇸', value: entry.us },
  ];

  return (
    <span
      ref={ref}
      style={{ position: 'relative', display: 'inline' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{
        borderBottom: '1px dotted rgba(212,168,67,0.3)',
        cursor: 'help',
      }}>
        {children ?? term}
      </span>

      {show && (
        <span
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            ...(pos === 'above'
              ? { bottom: '100%', marginBottom: 8 }
              : { top: '100%', marginTop: 8 }),
            zIndex: 9999,
            background: '#1A2332',
            border: '1px solid rgba(212,168,67,0.15)',
            borderRadius: 8,
            padding: '10px 14px',
            maxWidth: 320,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            pointerEvents: 'none',
          }}
        >
          {markets.map(m => {
            const active = m.id === system || (m.id === 'ma' && system === 'mena');
            return (
              <span key={m.id} style={{
                fontFamily: MONO,
                fontSize: 11,
                color: active ? '#D4A843' : '#9CA3AF',
                fontWeight: active ? 700 : 400,
                lineHeight: 1.6,
              }}>
                {m.flag} {m.value}
              </span>
            );
          })}
        </span>
      )}
    </span>
  );
}

/** Export glossary keys for reference */
export const SMART_LABEL_TERMS = Object.keys(GLOSSARY);
