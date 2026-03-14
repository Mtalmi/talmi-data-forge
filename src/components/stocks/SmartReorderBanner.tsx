import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ShoppingCart, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

interface ReorderRec {
  id: string;
  materiau: string;
  recommended_qty: number;
  urgency: string;
  fournisseur: string | null;
  unite: string;
  days_remaining: number | null;
}

export function SmartReorderBanner() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [recs, setRecs] = useState<ReorderRec[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('reorder_recommendations')
        .select('id, materiau, recommended_qty, urgency, fournisseur, unite, days_remaining')
        .eq('is_active', true)
        .in('urgency', ['urgent', 'critique'])
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setRecs(data as any);
    };
    fetch();

    const channel = supabase
      .channel('smart-reorder-banner')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reorder_recommendations' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const visible = recs.filter(r => !dismissed.has(r.id));
  if (visible.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {visible.map(rec => (
        <div key={rec.id} style={{
          background: 'rgba(239,68,68,0.04)',
          borderWidth: '1px 1px 1px 3px',
          borderStyle: 'solid',
          borderColor: 'rgba(239,68,68,0.15) rgba(239,68,68,0.15) rgba(239,68,68,0.15) #EF4444',
          borderRadius: 12, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          {/* Pulsing red dot */}
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: '#EF4444',
            boxShadow: '0 0 8px rgba(239,68,68,0.5)',
            animation: 'reorder-pulse 2s infinite',
            flexShrink: 0,
          }} />
          <Zap size={20} color="#EF4444" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#FFD700', marginBottom: 2, fontFamily: MONO }}>
              Agent IA: Réapprovisionnement recommandé pour <span style={{ color: '#EF4444', fontWeight: 600 }}>{rec.materiau}</span>
            </p>
            <p style={{ fontSize: 11, color: '#94A3B8', fontFamily: MONO }}>
              {rec.days_remaining !== null && (
                <>Stock estimé à <strong style={{ color: '#EF4444' }}>{Math.round(Number(rec.days_remaining) * 10) / 10}j</strong>. </>
              )}
              Commande suggérée: <span style={{ color: '#D4A843', fontWeight: 600, fontFamily: MONO }}>{Number(rec.recommended_qty).toLocaleString()} {rec.unite}</span>
              {rec.fournisseur && <> — <span style={{ color: '#fff', fontWeight: 500 }}>{rec.fournisseur}</span></>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => navigate('/fournisseurs')} style={{
              padding: '8px 20px', borderRadius: 8,
              background: '#D4A843', border: 'none',
              color: '#0F1629', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: MONO,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <ShoppingCart size={13} /> Créer Commande
            </button>
            <button onClick={() => setDismissed(prev => new Set(prev).add(rec.id))} style={{
              padding: '8px 16px', borderRadius: 8,
              background: 'transparent', border: '1px solid #D4A843',
              color: '#D4A843', fontSize: 13, cursor: 'pointer',
              fontFamily: MONO,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <X size={12} /> Ignorer
            </button>
          </div>
          <style>{`
            @keyframes reorder-pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.3); opacity: 0.6; }
            }
          `}</style>
        </div>
      ))}
    </div>
  );
}
