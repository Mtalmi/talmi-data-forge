import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ShoppingCart, X } from 'lucide-react';

interface CriticalMaterial {
  materiau: string;
  daysRemaining: number;
  quantite_actuelle: number;
  seuil_alerte: number;
  unite: string;
  capacite_max: number | null;
}

interface SmartReorderBannerProps {
  criticalMaterials: CriticalMaterial[];
}

export function SmartReorderBanner({ criticalMaterials }: SmartReorderBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const visible = criticalMaterials.filter(m => !dismissed.has(m.materiau) && m.daysRemaining < 3);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      {visible.map(mat => {
        const suggestedQty = Math.round((mat.capacite_max || mat.seuil_alerte * 3) - mat.quantite_actuelle);
        return (
          <div key={mat.materiau} style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,215,0,0.03) 100%)',
            border: '1px solid rgba(255,215,0,0.25)',
            borderRadius: 12, padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <Zap size={20} color="#FFD700" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#FFD700', marginBottom: 2 }}>
                Agent IA: Réapprovisionnement recommandé pour {mat.materiau}
              </p>
              <p style={{ fontSize: 11, color: '#94A3B8' }}>
                Stock estimé à <strong style={{ color: '#EF4444' }}>{mat.daysRemaining}j</strong>. 
                Commande suggérée: <strong style={{ color: '#FFD700' }}>{suggestedQty.toLocaleString()} {mat.unite}</strong>
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
              <button onClick={() => setDismissed(prev => new Set(prev).add(mat.materiau))} style={{
                padding: '6px 10px', borderRadius: 8,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                color: '#64748B', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <X size={12} /> Ignorer
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
