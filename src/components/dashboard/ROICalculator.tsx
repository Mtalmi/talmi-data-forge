import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FlaskConical, Shield, Eye, Truck, Clock, DollarSign, Trophy } from 'lucide-react';
import { useUnitFormat } from '@/hooks/useUnitFormat';
import { exportToCSV } from '@/lib/exportUtils';
import { triggerPrint } from '@/lib/printUtils';

const MN = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";
const TBOS_ANNUAL_COST_DH = 180_000;

function AnimatedValue({ value, prefix = '', suffix = '', color = '#22C55E', size = 24 }: { value: number; prefix?: string; suffix?: string; color?: string; size?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const prevRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const duration = 200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = end;
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  const formatted = displayed.toLocaleString('fr-FR').replace(/\u202F/g, ' ').replace(/\u00A0/g, ' ');
  return (
    <span style={{ fontFamily: MN, fontWeight: 200, fontSize: size, color }}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

function Slider({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; format: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{ fontFamily: MN, fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '1.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: MN, fontWeight: 200, fontSize: 20, color: '#D4A843', marginBottom: 8 }}>{format(value)}</div>
      <div style={{ position: 'relative', height: 6 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, borderRadius: 3, background: 'rgba(212,168,67,0.15)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: `${pct}%`, height: 6, borderRadius: 3, background: 'linear-gradient(90deg, rgba(212,168,67,0.6), #D4A843)' }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute', top: -6, left: 0, width: '100%', height: 18,
            appearance: 'none', WebkitAppearance: 'none', background: 'transparent', cursor: 'pointer',
          }}
          className="roi-slider"
        />
      </div>
    </div>
  );
}

export default function ROICalculator() {
  const { fmtCurrency, fmtCurrencyK, fmtVolume, currSym, rawCurrency } = useUnitFormat();

  const [production, setProduction] = useState(8000);
  const [trucks, setTrucks] = useState(4);
  const [clients, setClients] = useState(6);
  const [ca, setCa] = useState(900_000);

  const tbosAnnualCost = rawCurrency(TBOS_ANNUAL_COST_DH);

  const savings = useMemo(() => {
    const formules = production * 12 * 14;
    const arrets = 2 * (ca / 22) * 1;
    const vol = production * 12 * 1.5;
    const logistique = trucks * 52000 / 4 * trucks;
    const recouvrement = ca * 0.02 * 12;
    const tempsH = 40 + (clients * 0.5);
    const total = formules + arrets + vol + logistique + recouvrement;
    return { formules, arrets, vol, logistique, recouvrement, tempsH, total };
  }, [production, trucks, clients, ca]);

  const roiX = savings.total / TBOS_ANNUAL_COST_DH;
  const paybackMonths = Math.ceil(12 / roiX);
  const greenGlow = roiX > 5;
  const exceptional = roiX > 10;

  const cards = [
    { icon: FlaskConical, title: 'OPTIMISATION FORMULES', value: savings.formules, sub: 'Réduction sur-dosage ciment −24.8%' },
    { icon: Shield, title: 'PRÉVENTION ARRÊTS', value: savings.arrets, sub: `2 arrêts prévenus · ${fmtCurrency(ca / 22)}/jour chacun` },
    { icon: Eye, title: 'DÉTECTION VOL & FRAUDE', value: savings.vol, sub: 'Surveillance 24/7 · 4 agents forensiques' },
    { icon: Truck, title: 'OPTIMISATION LOGISTIQUE', value: savings.logistique, sub: 'Routes optimisées + retours à vide réduits' },
    { icon: DollarSign, title: 'RECOUVREMENT CRÉANCES', value: savings.recouvrement, sub: 'Surestaries facturées + retards réduits' },
    { icon: Clock, title: 'TEMPS GAGNÉ (DIRECTION)', value: savings.tempsH, sub: 'Rapports automatiques + briefings IA', isTime: true },
  ];

  const handleExportROI = () => {
    const rows = cards.map(c => ({
      categorie: c.title,
      economie: c.isTime ? `${Math.round(c.value)} heures/mois` : `${Math.round(c.value)} DH/an`,
      detail: c.sub,
    }));
    rows.push({ categorie: 'TOTAL ÉCONOMIES', economie: `${Math.round(savings.total)} DH/an`, detail: `ROI: ${roiX.toFixed(1)}x` });
    rows.push({ categorie: 'PARAMÈTRES', economie: `Production: ${production} m³/mois`, detail: `CA: ${ca} DH/mois · ${trucks} toupies · ${clients} clients` });
    exportToCSV(rows, [
      { key: 'categorie', label: 'Catégorie' },
      { key: 'economie', label: 'Économie' },
      { key: 'detail', label: 'Détail' },
    ], `TBOS_ROI_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const costBarTotal = savings.total + TBOS_ANNUAL_COST_DH;
  const costPct = (TBOS_ANNUAL_COST_DH / costBarTotal) * 100;
  const savingsPct = (savings.total / costBarTotal) * 100;
  const ratio = savings.total / TBOS_ANNUAL_COST_DH;

  return (
    <div className="mt-8 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #D4A843' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span style={{ color: '#D4A843', fontSize: 14, animation: 'pulse 3s ease-in-out infinite' }}>✦</span>
          <span style={{ fontFamily: MN, fontSize: 12, fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.5px' }}>CALCULATEUR ROI — IMPACT TBOS SUR VOTRE CENTRALE</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: MN, fontSize: 9, color: '#D4A843', background: 'transparent', border: '1px solid rgba(212,168,67,0.4)', borderRadius: 20, padding: '3px 10px' }}>
            Interactif · Personnalisable
          </span>
          <span style={{ fontFamily: MN, fontSize: 9, color: '#D4A843', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 20, padding: '3px 10px' }}>
            ✨ Généré par IA · Claude Opus
          </span>
        </div>
      </div>

      {/* ── INPUT SECTION ── */}
      <div style={{ padding: '16px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontFamily: MN, fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '1.5px', marginBottom: 16 }}>PARAMÈTRES DE VOTRE CENTRALE</div>
        <div className="flex gap-6 flex-wrap">
          <Slider label="PRODUCTION MENSUELLE" value={production} onChange={setProduction} min={500} max={50000} step={500} format={v => fmtVolume(v)} />
          <Slider label="NOMBRE DE TOUPIES" value={trucks} onChange={setTrucks} min={1} max={50} step={1} format={v => `${v}`} />
          <Slider label="NOMBRE DE CLIENTS ACTIFS" value={clients} onChange={setClients} min={1} max={200} step={1} format={v => `${v}`} />
          <Slider label="CHIFFRE D'AFFAIRES MENSUEL" value={ca} onChange={setCa} min={100_000} max={50_000_000} step={50_000} format={v => fmtCurrencyK(v)} />
        </div>
      </div>

      {/* ── RESULTS SECTION ── */}
      <div style={{ padding: '20px' }}>
        <div style={{ fontFamily: MN, fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '1.5px', marginBottom: 16 }}>ÉCONOMIES ESTIMÉES AVEC TBOS</div>
        <div className="grid grid-cols-3 gap-4">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderTop: '2px solid #22C55E', borderRadius: 8, padding: '16px',
              }}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={14} style={{ color: '#22C55E' }} />
                  <span style={{ fontFamily: MN, fontSize: 10, fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.5px' }}>{card.title}</span>
                </div>
                {card.isTime ? (
                  <AnimatedValue value={Math.round(card.value)} suffix=" heures/mois" color="#22C55E" size={24} />
                ) : (
                  <div>
                    <AnimatedValue value={Math.round(rawCurrency(card.value))} suffix={` ${currSym}/an`} color="#22C55E" size={24} />
                  </div>
                )}
                <div style={{ fontFamily: MN, fontSize: 10, color: '#9CA3AF', marginTop: 6, lineHeight: 1.5 }}>{card.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TOTAL ROI ── */}
      <div style={{
        margin: '0 20px 16px', padding: '20px 24px', borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(212,168,67,0.08), rgba(212,168,67,0.02))',
        border: '1px solid rgba(212,168,67,0.2)',
        ...(greenGlow ? { boxShadow: '0 0 30px rgba(34,197,94,0.15)' } : {}),
      }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <span style={{ fontFamily: MN, fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '1.5px' }}>ÉCONOMIES TOTALES ESTIMÉES</span>
          <div className="flex items-center gap-4 flex-wrap">
            <AnimatedValue value={Math.round(rawCurrency(savings.total))} suffix={` ${currSym}/an`} color="#22C55E" size={48} />
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: MN, fontWeight: 200, fontSize: 36, color: '#D4A843' }}>{roiX.toFixed(1)}x</span>
              <span style={{ fontFamily: MN, fontSize: 10, color: '#D4A843' }}>ROI</span>
            </div>
            {exceptional && (
              <span style={{ fontFamily: MN, fontSize: 11, color: '#D4A843', background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Trophy size={12} /> ROI Exceptionnel
              </span>
            )}
          </div>
        </div>
        <div style={{ fontFamily: MN, fontSize: 11, color: '#D4A843', marginTop: 10, opacity: 0.8 }}>
          Retour sur investissement estimé en <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{paybackMonths} mois</span>
        </div>
      </div>

      {/* ── COMPARISON BAR ── */}
      <div style={{ margin: '0 20px 20px' }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontFamily: MN, fontSize: 10, color: '#9CA3AF', letterSpacing: '1px' }}>COMPARAISON COÛT VS ÉCONOMIES</span>
        </div>
        <div className="flex" style={{ height: 28, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ width: `${Math.max(costPct, 3)}%`, background: 'rgba(239,68,68,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 300ms' }}>
            <span style={{ fontFamily: MN, fontSize: 9, color: '#FFF', fontWeight: 600, whiteSpace: 'nowrap' }}>Coût TBOS: {fmtCurrencyK(TBOS_ANNUAL_COST_DH)}/an</span>
          </div>
          <div style={{ width: `${savingsPct}%`, background: 'linear-gradient(90deg, rgba(34,197,94,0.5), rgba(34,197,94,0.7))', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 300ms' }}>
            <span style={{ fontFamily: MN, fontSize: 9, color: '#FFF', fontWeight: 600, whiteSpace: 'nowrap' }}>Économies: {fmtCurrencyK(savings.total)}</span>
          </div>
        </div>
        <div style={{ fontFamily: MN, fontSize: 11, color: '#D4A843', marginTop: 6, textAlign: 'center' }}>
          1 {currSym} investi = <span style={{ color: '#22C55E', fontWeight: 600 }}>{ratio.toFixed(1)} {currSym}</span> économisés
        </div>
      </div>

      {/* ── EXPORT BUTTON ── */}
      <div style={{ padding: '12px 20px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'center', gap: 12 }}>
        <button
          onClick={handleExportROI}
          style={{
            fontFamily: MN, fontSize: 12, fontWeight: 600,
            background: '#D4A843', color: '#0F1629',
            border: 'none', borderRadius: 6, padding: '10px 28px',
            cursor: 'pointer', letterSpacing: '0.5px',
            transition: 'all 200ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E0B84E'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#D4A843'; }}
        >
          GÉNÉRER RAPPORT ROI
        </button>
        <button
          onClick={() => triggerPrint()}
          style={{
            fontFamily: MN, fontSize: 12, fontWeight: 600,
            background: 'transparent', color: '#D4A843',
            border: '1px solid rgba(212,168,67,0.4)', borderRadius: 6, padding: '10px 28px',
            cursor: 'pointer', letterSpacing: '0.5px',
            transition: 'all 200ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          🖨 IMPRIMER
        </button>
      </div>

      {/* Slider thumb styles */}
      <style>{`
        .roi-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #D4A843;
          border: 2px solid #0F1629;
          box-shadow: 0 0 6px rgba(212,168,67,0.4);
          cursor: pointer;
        }
        .roi-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #D4A843;
          border: 2px solid #0F1629;
          box-shadow: 0 0 6px rgba(212,168,67,0.4);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
