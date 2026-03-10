import React, { useEffect, useState } from 'react';
import { X, MapPin, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getStatusConfig } from '@/lib/workflowStatus';

interface Delivery {
  bl_id: string;
  client_name: string;
  formule_id: string;
  volume_m3: number;
  heure_prevue: string | null;
  workflow_status: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RouteOptimizationPanel({ open, onClose }: Props) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    supabase
      .from('bons_livraison_reels')
      .select('bl_id, formule_id, volume_m3, heure_prevue, workflow_status, client_id, clients(nom_client)')
      .eq('date_livraison', todayStr)
      .order('heure_prevue', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        const mapped: Delivery[] = (data ?? []).map((d: any) => ({
          bl_id: d.bl_id,
          client_name: d.clients?.nom_client ?? 'Client inconnu',
          formule_id: d.formule_id,
          volume_m3: d.volume_m3,
          heure_prevue: d.heure_prevue,
          workflow_status: d.workflow_status,
        }));
        setDeliveries(mapped);
        setLoading(false);
      });
  }, [open]);

  if (!open) return null;

  const totalVolume = deliveries.reduce((s, d) => s + d.volume_m3, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, zIndex: 9999,
        background: '#0F1629',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 300ms ease-out',
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          borderLeft: '4px solid #D4A843',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={18} color="#FFD700" />
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
                Livraisons du Jour
              </h2>
              <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>
                {format(new Date(), 'dd/MM/yyyy')} — {deliveries.length} livraison{deliveries.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={14} color="#94A3B8" />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <p style={{ color: '#64748B', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>Chargement...</p>
          ) : deliveries.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>Aucune livraison planifiée aujourd'hui.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {deliveries.map((d, i) => {
                const sc = getStatusConfig(d.workflow_status);
                return (
                  <div key={d.bl_id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 10,
                  }}>
                    {/* Stop number */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#FFD700',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {i + 1}
                    </div>
                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.client_name}
                      </p>
                      <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>
                        {d.formule_id} — {d.volume_m3} m³{d.heure_prevue ? ` — ${d.heure_prevue.slice(0, 5)}` : ''}
                      </p>
                    </div>
                    {/* Status badge */}
                    <span style={{
                      fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '3px 8px', borderRadius: 999, flexShrink: 0,
                      background: 'rgba(255,255,255,0.05)',
                      color: '#94A3B8',
                    }}>
                      {sc.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {deliveries.length > 0 && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={14} color="#FFD700" />
              <span style={{ fontSize: 12, color: '#94A3B8' }}>Total</span>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', fontFamily: 'JetBrains Mono, monospace' }}>
                {deliveries.length} livraison{deliveries.length !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#FFD700', fontFamily: 'JetBrains Mono, monospace' }}>
                {totalVolume} m³
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
