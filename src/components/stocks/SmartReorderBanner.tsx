import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ShoppingCart, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
    <div className="space-y-3">
      {visible.map(rec => (
        <div key={rec.id} style={{
          background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,215,0,0.03) 100%)',
          border: '1px solid rgba(255,215,0,0.25)',
          borderRadius: 12, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <Zap size={20} color="#FFD700" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#FFD700', marginBottom: 2 }}>
              Agent IA: Réapprovisionnement recommandé pour {rec.materiau}
            </p>
            <p style={{ fontSize: 11, color: '#94A3B8' }}>
              {rec.days_remaining !== null && (
                <>Stock estimé à <strong style={{ color: '#EF4444' }}>{Number(rec.days_remaining)}j</strong>. </>
              )}
              Commande suggérée: <strong style={{ color: '#FFD700' }}>{Number(rec.recommended_qty).toLocaleString()} {rec.unite}</strong>
              {rec.fournisseur && <> — {rec.fournisseur}</>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => navigate('/fournisseurs')} style={{
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)',
              color: '#FFD700', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <ShoppingCart size={12} /> Créer Commande
            </button>
            <button onClick={() => setDismissed(prev => new Set(prev).add(rec.id))} style={{
              padding: '6px 10px', borderRadius: 8,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: '#64748B', fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <X size={12} /> Ignorer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
