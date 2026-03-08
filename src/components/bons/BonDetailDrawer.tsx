import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Truck, Package, Calendar, User, MapPin, CreditCard, FileText,
  Printer, Send, X, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BonDetailDrawerProps {
  blId: string | null;
  open: boolean;
  onClose: () => void;
}

interface BonData {
  bl_id: string;
  date_livraison: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  ciment_reel_kg: number;
  sable_reel_kg: number | null;
  gravette_reel_kg: number | null;
  eau_reel_l: number | null;
  adjuvant_reel_l: number | null;
  prix_vente_m3: number | null;
  cur_reel: number | null;
  marge_brute_pct: number | null;
  workflow_status: string | null;
  statut_paiement: string;
  toupie_assignee: string | null;
  chauffeur_nom: string | null;
  mode_paiement: string | null;
  bc_id: string | null;
  created_at: string;
  zone_livraison_id: string | null;
  prix_livraison_m3: number | null;
}

const paymentColor: Record<string, string> = {
  'Payé': '#22c55e',
  'En Attente': '#F59E0B',
  'Retard': '#ef4444',
};

export function BonDetailDrawer({ blId, open, onClose }: BonDetailDrawerProps) {
  const [bon, setBon] = useState<BonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  useEffect(() => {
    if (blId && open) fetchData();
    if (!open) { setBon(null); setClientName(''); setClientAddress(''); }
  }, [blId, open]);

  const fetchData = async () => {
    if (!blId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bons_livraison_reels')
        .select('*')
        .eq('bl_id', blId)
        .single();
      if (error) throw error;
      setBon(data);

      // Fetch client info
      if (data.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('nom_client, adresse')
          .eq('client_id', data.client_id)
          .single();
        if (client) {
          setClientName(client.nom_client || data.client_id);
          setClientAddress(client.adresse || '—');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const totalHT = bon ? (bon.volume_m3 * (bon.prix_vente_m3 || 0)) : 0;

  const content = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 200ms',
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 520, maxWidth: '100vw', zIndex: 9999,
          background: '#0F1629',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          overflowY: 'auto',
          animation: 'slideInRight 250ms ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            borderLeft: '4px solid #D4A843',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
              Détail Bon de Livraison
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'ui-monospace, monospace' }}>
              {bon?.bl_id || blId}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: 8, color: '#94A3B8', cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <Loader2 size={28} style={{ color: '#D4A843', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : bon ? (
          <div style={{ padding: '20px 24px' }}>
            {/* Client Section */}
            <Section icon={User} label="Client">
              <Row label="Nom" value={clientName || bon.client_id} />
              <Row label="Adresse chantier" value={clientAddress} />
            </Section>

            {/* Formule Section */}
            <Section icon={Package} label="Formule">
              <Row label="Formule" value={bon.formule_id} mono />
              <Row label="Volume" value={`${bon.volume_m3} m³`} gold />
              <Row label="Ciment" value={`${bon.ciment_reel_kg} kg`} />
              {bon.sable_reel_kg && <Row label="Sable" value={`${bon.sable_reel_kg} kg`} />}
              {bon.gravette_reel_kg && <Row label="Gravette" value={`${bon.gravette_reel_kg} kg`} />}
              {bon.eau_reel_l && <Row label="Eau" value={`${bon.eau_reel_l} L`} />}
              {bon.adjuvant_reel_l && <Row label="Adjuvant" value={`${bon.adjuvant_reel_l} L`} />}
            </Section>

            {/* Livraison Section */}
            <Section icon={Truck} label="Livraison">
              <Row label="Date" value={format(new Date(bon.date_livraison), 'dd/MM/yyyy')} />
              <Row label="Chauffeur" value={bon.chauffeur_nom || '—'} />
              <Row label="Toupie" value={bon.toupie_assignee || '—'} mono />
              {bon.bc_id && <Row label="Bon Commande" value={bon.bc_id} mono />}
            </Section>

            {/* Financier Section */}
            <Section icon={CreditCard} label="Paiement">
              <Row label="Prix/m³" value={bon.prix_vente_m3 ? `${bon.prix_vente_m3.toLocaleString('fr-MA')} DH` : '—'} />
              <Row label="Total HT" value={`${totalHT.toLocaleString('fr-MA')} DH`} gold />
              <Row label="Mode" value={bon.mode_paiement || '—'} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Statut</span>
                <Badge
                  style={{
                    background: `${paymentColor[bon.statut_paiement] || '#64748B'}20`,
                    color: paymentColor[bon.statut_paiement] || '#64748B',
                    border: `1px solid ${paymentColor[bon.statut_paiement] || '#64748B'}40`,
                  }}
                >
                  {bon.statut_paiement}
                </Badge>
              </div>
            </Section>

            {/* Workflow */}
            <Section icon={FileText} label="Workflow">
              <Row label="Statut" value={bon.workflow_status || 'planification'} />
              {bon.marge_brute_pct != null && <Row label="Marge brute" value={`${bon.marge_brute_pct.toFixed(1)}%`} />}
              {bon.cur_reel != null && <Row label="CUR" value={`${bon.cur_reel.toFixed(0)} DH/m³`} />}
            </Section>

            {/* Actions */}
            <div style={{
              display: 'flex', gap: 12, marginTop: 24, paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <button
                onClick={() => { toast.success(`Impression BL ${bon.bl_id} lancée`); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 16px', borderRadius: 10,
                  background: '#D4A843', color: '#000', fontWeight: 600, fontSize: 13,
                  border: 'none', cursor: 'pointer',
                  transition: 'opacity 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                <Printer size={16} />
                Imprimer BL
              </button>
              <button
                onClick={() => { toast.success(`Envoi au client pour ${bon.bl_id} initié`); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontWeight: 600, fontSize: 13,
                  border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.15)'; }}
              >
                <Send size={16} />
                Envoyer au Client
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );

  return createPortal(content, document.body);
}

/* Sub-components */
function Section({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={14} style={{ color: '#D4A843' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {label}
        </span>
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: '4px 16px',
      }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, mono, gold }: { label: string; value: string; mono?: boolean; gold?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 500,
        color: gold ? '#D4A843' : '#E2E8F0',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : 'inherit',
      }}>
        {value}
      </span>
    </div>
  );
}
