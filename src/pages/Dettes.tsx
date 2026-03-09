import { useState, useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import MainLayout from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePayables, Payable } from '@/hooks/usePayables';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Calendar as CalendarIcon,
  Loader2,
  DollarSign,
  CreditCard,
  FileText,
  TrendingDown,
  CalendarDays,
  Banknote,
  Timer,
  Zap,
  Eye,
  Check,
  Handshake,
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AGING_COLORS = ['hsl(var(--success))', 'hsl(142, 76%, 36%)', 'hsl(var(--warning))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

export default function Dettes() {
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const d = t.pages.dettes;
  const { isCeo, role } = useAuth();
  const { 
    payables, 
    schedules, 
    stats, 
    loading, 
    refetch, 
    schedulePayment,
    executePayment,
    getPayablesBySupplier,
    getDueSoon,
    getOverdue,
  } = usePayables();

  const STATUS_CONFIG: Record<string, { label: string; badgeStyle: React.CSSProperties; icon: React.ReactNode; pulse?: boolean }> = {
    'not_due': { label: 'À payer', badgeStyle: { background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b', color: '#f59e0b' }, icon: <Clock className="h-3 w-3" /> },
    'due_soon': { label: 'Urgent', badgeStyle: { background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444' }, icon: <Zap className="h-3 w-3" />, pulse: true },
    'due_today': { label: 'Urgent', badgeStyle: { background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444' }, icon: <Zap className="h-3 w-3" />, pulse: true },
    'overdue': { label: 'En retard', badgeStyle: { background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444' }, icon: <AlertTriangle className="h-3 w-3" />, pulse: true },
    'paid': { label: 'Payé', badgeStyle: { background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e', color: '#22c55e' }, icon: <CheckCircle className="h-3 w-3" /> },
  };

  const [activeTab, setActiveTab] = useState('payables');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('virement');
  const [paymentReference, setPaymentReference] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [processingAction, setProcessingAction] = useState(false);
  const [reminderToggles, setReminderToggles] = useState({ email7j: true, whatsapp3j: true, push0j: false });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPayable, setDrawerPayable] = useState<Payable | null>(null);
  const [drawerMethod, setDrawerMethod] = useState('virement');
  const [drawerDate, setDrawerDate] = useState<Date | undefined>(undefined);
  const [drawerNote, setDrawerNote] = useState('');
  const [drawerConfirmed, setDrawerConfirmed] = useState(false);
  const [expandedNego, setExpandedNego] = useState<Record<string, boolean>>({});

  const canManagePayables = isCeo || role === 'agent_administratif' || role === 'superviseur';

  const filteredPayables = payables.filter(p => {
    const matchesSearch = 
      p.fournisseur_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const payablesBySupplier = getPayablesBySupplier();
  const dueSoon = getDueSoon();
  const overdue = getOverdue();

  const handleExecutePayment = async () => {
    if (!selectedPayable || paymentAmount <= 0) return;
    setProcessingAction(true);

    try {
      await executePayment(selectedPayable, paymentAmount, paymentMethod, paymentReference);
      setPaymentDialogOpen(false);
      setSelectedPayable(null);
      setPaymentAmount(0);
      setPaymentReference('');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSchedulePayment = async () => {
    if (!selectedPayable || !scheduledDate) return;
    setProcessingAction(true);

    try {
      await schedulePayment(selectedPayable, scheduledDate, paymentMethod);
      setScheduleDialogOpen(false);
      setSelectedPayable(null);
      setScheduledDate(undefined);
    } finally {
      setProcessingAction(false);
    }
  };

  const formatCurrency = (value: number) => `${value.toLocaleString('fr-MA')} DH`;

  const agingChartData = stats.agingBuckets.map((bucket, index) => ({
    name: bucket.bucket,
    montant: bucket.total_amount,
    count: bucket.invoice_count,
    fill: AGING_COLORS[index % AGING_COLORS.length],
  }));

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  const hasData = payables.length > 0;
  const startDate = new Date('2026-01-25');

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* TBOS Header */}
        <PageHeader
          icon={Building2}
          title="Dettes Fournisseurs"
          subtitle="Données en temps réel"
          loading={loading}
        />

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Premium Info Banner */}
        <div style={{
          background: 'rgba(212,168,67,0.06)',
          border: '1px solid rgba(212,168,67,0.2)',
          borderRadius: 12,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={20} color="#D4A843" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Système de Paiements Fournisseurs</h3>
            <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 14 }}>
              Suivi en temps réel — {format(new Date(), 'dd MMMM yyyy', { locale: dateLocale || undefined })}
              {hasData && ` • DPO: ${stats.dpoAverage} jours`}
            </p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Alerte 7j avant échéance', icon: Timer },
                { label: 'Programmation automatique', icon: CalendarDays },
                { label: 'Objectif 100% à temps', icon: CheckCircle },
              ].map((pill, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94A3B8' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A843', flexShrink: 0 }} />
                  <pill.icon size={14} color="#D4A843" />
                  <span>{pill.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} style={{ border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843', background: 'rgba(212,168,67,0.08)' }}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>

        {/* Urgent Alerts */}
        {hasData && (dueSoon.length > 0 || overdue.length > 0) && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-warning">{d.urgentPayments}</p>
                  <p className="text-sm text-muted-foreground">
                    {overdue.length > 0 && `${overdue.length} ${d.invoicesOverdue} (${formatCurrency(stats.totalOverdue)})`}
                    {overdue.length > 0 && dueSoon.length > 0 && ' • '}
                    {dueSoon.length > 0 && `${dueSoon.length} ${d.invoicesDueSoon} (${formatCurrency(stats.totalDueSoon)})`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TABLEAU DE BORD DIRECTEUR */}
        {(() => {
          const unpaidAll = payables.filter(p => p.status !== 'paid');
          const overdueAll = unpaidAll.filter(p => p.days_overdue > 0);
          const overdueRatio = unpaidAll.length > 0 ? overdueAll.length / unpaidAll.length : 0;
          const avgOverdueDays = overdueAll.length > 0 ? overdueAll.reduce((s, p) => s + p.days_overdue, 0) / overdueAll.length : 0;
          const healthScore = Math.max(0, Math.min(100, Math.round(100 - overdueRatio * 50 - avgOverdueDays * 0.8)));
          const scoreColor = healthScore >= 75 ? '#22c55e' : healthScore >= 50 ? '#f59e0b' : '#ef4444';
          const scoreLabel = healthScore >= 75 ? 'EXCELLENT' : healthScore >= 50 ? 'BON' : 'CRITIQUE';
          const scoreBadgeBg = healthScore >= 75 ? 'rgba(34,197,94,0.15)' : healthScore >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)';

          const activeSuppliers = new Set(unpaidAll.map(p => p.fournisseur_name)).size;
          const invoicesThisMonth = unpaidAll.length;
          const savingsNego = Math.round(overdueAll.reduce((s, p) => s + p.amount_due * 0.06 * (p.days_overdue / 365), 0) * 0.7);
          const retardsEvites = Math.max(0, unpaidAll.filter(p => p.days_until_due <= 3 && p.days_until_due >= 0).length);

          const actions = [
            overdueAll.length > 0 && { priority: 'URGENT', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', text: `Régulariser ${overdueAll.length} facture${overdueAll.length > 1 ? 's' : ''} en retard — ${overdueAll.reduce((s,p) => s + p.amount_due, 0).toLocaleString('fr-MA')} DH` },
            retardsEvites > 0 && { priority: 'MOYEN', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', text: `Programmer ${retardsEvites} paiement${retardsEvites > 1 ? 's' : ''} à échéance cette semaine` },
            { priority: 'PLANIFIÉ', color: '#D4A843', bg: 'rgba(212,168,67,0.15)', text: `Optimiser séquence paiements pour économiser ${savingsNego.toLocaleString('fr-MA')} DH en pénalités` },
          ].filter(Boolean).slice(0, 3) as { priority: string; color: string; bg: string; text: string }[];

          return (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderTop: '2px solid #D4A843',
              borderRadius: 12,
              padding: '28px 32px',
              display: 'grid',
              gridTemplateColumns: '1fr 1.1fr 1.3fr',
              gap: 32,
            }}>
              {/* LEFT — Health Score */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>Santé Paiements IA</span>
                <p style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                  fontWeight: 200, fontSize: 72, letterSpacing: '-0.03em', lineHeight: 1,
                  color: scoreColor, WebkitFontSmoothing: 'antialiased',
                }}>
                  {healthScore}
                </p>
                <span style={{ fontSize: 12, color: '#6B7280' }}>/100</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
                  background: scoreBadgeBg, color: scoreColor, border: `1px solid ${scoreColor}40`,
                  letterSpacing: '0.1em', marginTop: 4,
                }}>
                  {scoreLabel}
                </span>
              </div>

              {/* CENTER — 2x2 Micro KPIs */}
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '0 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Fournisseurs actifs', value: String(activeSuppliers), color: '#F1F5F9' },
                  { label: 'Factures ce mois', value: String(invoicesThisMonth), color: '#F1F5F9' },
                  { label: 'Économies négociées IA', value: `${savingsNego.toLocaleString('fr-MA')} DH`, color: '#D4A843' },
                  { label: 'Retards évités', value: String(retardsEvites), color: '#22c55e' },
                ].map((mk, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280' }}>{mk.label}</span>
                    <span style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                      fontSize: 22, fontWeight: 200, color: mk.color, letterSpacing: '-0.02em',
                    }}>{mk.value}</span>
                  </div>
                ))}
              </div>

              {/* RIGHT — AI Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Zap size={14} color="#D4A843" />
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>Actions prioritaires IA</span>
                </div>
                {actions.map((action, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 12,
                      background: action.bg, color: action.color, border: `1px solid ${action.color}40`,
                      whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1,
                    }}>
                      {action.priority}
                    </span>
                    <span style={{ fontSize: 12, color: '#D1D5DB', lineHeight: 1.5 }}>{action.text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* KPI Cards — Glassmorphism */}
        {(() => {
          const tauxColor = stats.paymentRate >= 80 ? '#22c55e' : stats.paymentRate >= 60 ? '#f59e0b' : '#ef4444';
          const kpis = [
            { label: 'DETTES TOTALES', value: formatCurrency(stats.totalOutstanding), color: '#D4A843', icon: TrendingDown, pulse: false },
            { label: 'À PAYER', value: formatCurrency(stats.totalDueSoon), color: '#f59e0b', icon: Timer, pulse: false },
            { label: 'EN RETARD', value: formatCurrency(stats.totalOverdue), color: '#ef4444', icon: AlertTriangle, pulse: true },
            { label: 'TAUX PAIEMENT', value: `${stats.paymentRate.toFixed(1)}%`, color: tauxColor, icon: CheckCircle, pulse: false },
            { label: 'PROGRAMMÉS', value: String(stats.scheduledPayments), color: '#4A9EFF', icon: CalendarDays, pulse: false },
            (() => {
              const totalPayables = payables.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount_due, 0);
              const monthlyPurchases = totalPayables * 0.8 || 1;
              const dpo = Math.round((totalPayables / monthlyPurchases) * 30);
              const dpoColor = dpo >= 45 ? '#22c55e' : dpo >= 30 ? '#f59e0b' : '#ef4444';
              return { label: 'DPO IA', value: `${dpo}j`, color: dpoColor, icon: Clock, pulse: false, benchmark: 45 };
            })(),
          ];
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {kpis.map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderLeft: `3px solid ${kpi.color}`,
                    borderRadius: 12,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    animation: kpi.pulse ? 'tbos-pulse 2.5s infinite' : undefined,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${kpi.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={kpi.color} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9CA3AF' }}>{kpi.label}</span>
                    </div>
                    <p style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                      fontWeight: 200,
                      fontSize: kpi.value.length > 12 ? 30 : 48,
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                      color: '#FFFFFF',
                      WebkitFontSmoothing: 'antialiased',
                    }}>{kpi.value}</p>
                    {'benchmark' in kpi && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 10, color: '#D4A843', letterSpacing: '0.05em' }}>Délai moyen de paiement</span>
                        <span style={{ fontSize: 10, color: '#6B7280' }}>Industrie: {(kpi as any).benchmark}j</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* AI Agent Banner */}
        {(() => {
          const unpaid = payables.filter(p => p.status !== 'paid');
          const overdueItems = unpaid.filter(p => p.days_overdue > 0);
          const thisWeekDue = unpaid.filter(p => p.days_until_due >= 0 && p.days_until_due <= 7);
          const atRiskTotal = [...overdueItems, ...thisWeekDue].reduce((s, p) => s + p.amount_due, 0);
          const atRiskSuppliers = new Set([...overdueItems, ...thisWeekDue].map(p => p.fournisseur_name)).size;
          const mostUrgent = overdueItems.sort((a, b) => b.days_overdue - a.days_overdue)[0];
          const sortedForCash = [...unpaid].sort((a, b) => a.days_until_due - b.days_until_due);
          const top3 = sortedForCash.slice(0, 3).map(p => p.fournisseur_name);

          return (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: '3px solid #D4A843',
              borderRadius: 12,
              padding: '20px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={16} color="#D4A843" />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>
                    Agent IA — Gestion Dettes Fournisseurs
                  </span>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'tbos-pulse 2s infinite' }} />
                </div>
                <Button
                  size="sm"
                  style={{
                    background: 'linear-gradient(135deg, #D4A843, #b8922e)',
                    color: '#000', fontWeight: 600, border: 'none',
                    borderRadius: 8, padding: '8px 16px', fontSize: 12,
                  }}
                >
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Optimiser Paiements IA
                </Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#D1D5DB' }}>
                  <span style={{ color: '#D4A843', flexShrink: 0 }}>①</span>
                  <span>
                    <strong style={{ color: '#F1F5F9' }}>{atRiskTotal.toLocaleString('fr-MA')} DH</strong> à risque cette semaine
                    — <span style={{ color: '#f59e0b' }}>{atRiskSuppliers} fournisseur{atRiskSuppliers !== 1 ? 's' : ''}</span> concerné{atRiskSuppliers !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#D1D5DB' }}>
                  <span style={{ color: '#D4A843', flexShrink: 0 }}>②</span>
                  <span>
                    Urgence maximale : <strong style={{ color: '#ef4444' }}>{mostUrgent ? mostUrgent.fournisseur_name : '—'}</strong>
                    {mostUrgent && <> — <span style={{ fontFamily: 'ui-monospace', color: '#ef4444' }}>{mostUrgent.days_overdue}j</span> de retard</>}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#D1D5DB' }}>
                  <span style={{ color: '#D4A843', flexShrink: 0 }}>③</span>
                  <span>
                    Séquence recommandée : {top3.length > 0
                      ? top3.map((name, i) => (
                          <span key={i}>
                            {i > 0 && ' → '}
                            <strong style={{ color: '#F1F5F9' }}>{name}</strong>
                          </span>
                        ))
                      : '—'
                    }
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* RAPPELS AUTOMATIQUES IA */}
        {(() => {
          const unpaid = payables.filter(p => p.status !== 'paid');
          const reminders = [
            { key: 'email7j' as const, label: 'Email automatique', trigger: '7 jours avant échéance', desc: 'Brouillon envoyé au service comptabilité', icon: '📧', color: '#D4A843' },
            { key: 'whatsapp3j' as const, label: 'Alerte WhatsApp', trigger: '3 jours avant échéance', desc: 'Notification au directeur financier', icon: '💬', color: '#22c55e' },
            { key: 'push0j' as const, label: 'Push notification', trigger: 'Jour de l\'échéance', desc: 'Alerte critique sur mobile', icon: '🔔', color: '#ef4444' },
          ];

          // Simulated last sent per supplier
          const lastSent: Record<string, string> = {
            'Sika Maroc': '08/03 à 09:14',
            'Total Maroc': '07/03 à 14:30',
            'Sopromat': '06/03 à 11:45',
          };
          const suppliersWithReminders = unpaid
            .filter(p => p.days_until_due <= 7 || p.days_overdue > 0)
            .slice(0, 5);

          return (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: '3px solid #D4A843',
              borderRadius: 12,
              padding: '20px 24px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={16} color="#D4A843" />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>
                    Rappels Automatiques IA
                  </span>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'tbos-pulse 2s infinite' }} />
                </div>
                <Button size="sm" style={{
                  background: 'linear-gradient(135deg, #D4A843, #b8922e)',
                  color: '#000', fontWeight: 600, border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12,
                }}
                  onClick={() => setReminderToggles({ email7j: true, whatsapp3j: true, push0j: true })}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Activer Tous
                </Button>
              </div>

              {/* Reminder pipeline */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                {reminders.map((rem) => {
                  const isOn = reminderToggles[rem.key];
                  return (
                    <div key={rem.key} style={{
                      flex: 1, padding: '14px 16px', borderRadius: 10,
                      background: isOn ? `${rem.color}08` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isOn ? `${rem.color}30` : 'rgba(255,255,255,0.06)'}`,
                      transition: 'all 200ms',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 18 }}>{rem.icon}</span>
                        {/* Toggle switch */}
                        <div
                          onClick={() => setReminderToggles(prev => ({ ...prev, [rem.key]: !prev[rem.key] }))}
                          style={{
                            width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
                            background: isOn ? rem.color : 'rgba(255,255,255,0.1)',
                            position: 'relative', transition: 'background 200ms',
                          }}
                        >
                          <div style={{
                            width: 16, height: 16, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 2, left: isOn ? 18 : 2,
                            transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }} />
                        </div>
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', marginBottom: 2 }}>{rem.label}</p>
                      <p style={{ fontSize: 11, color: rem.color, fontWeight: 500, marginBottom: 4 }}>{rem.trigger}</p>
                      <p style={{ fontSize: 10, color: '#6B7280' }}>{rem.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Last reminders sent per supplier */}
              {suppliersWithReminders.length > 0 && (
                <div>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280', marginBottom: 8, display: 'block' }}>
                    Derniers rappels envoyés
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {suppliersWithReminders.map((p, i) => {
                      const sent = lastSent[p.fournisseur_name];
                      return (
                        <div key={p.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderBottom: i < suppliersWithReminders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.days_overdue > 0 ? '#ef4444' : '#f59e0b' }} />
                            <span style={{ fontSize: 12, color: '#F1F5F9' }}>{p.fournisseur_name}</span>
                            <span style={{ fontSize: 11, fontFamily: 'ui-monospace', color: '#D4A843' }}>
                              {p.amount_due.toLocaleString('fr-MA')} DH
                            </span>
                          </div>
                          <span style={{ fontSize: 10, fontFamily: 'ui-monospace', color: sent ? '#9CA3AF' : '#3f3f46' }}>
                            {sent ? `Envoyé ${sent}` : 'Aucun rappel'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* IMPACT TRÉSORERIE IA */}
        {(() => {
          const unpaid = payables.filter(p => p.status !== 'paid');
          const totalOutstanding = unpaid.reduce((s, p) => s + p.amount_due, 0);
          const today = new Date();

          // 4-week forecast
          const weekAmounts = [0, 1, 2, 3].map(w => {
            const items = unpaid.filter(p => {
              const diff = Math.floor((new Date(p.due_date).getTime() - today.getTime()) / 86400000);
              const overdue = p.days_overdue > 0;
              if (w === 0) return overdue || (diff >= 0 && diff < 7);
              return diff >= w * 7 && diff < (w + 1) * 7;
            });
            return items.reduce((s, p) => s + p.amount_due, 0);
          });
          const maxWeek = Math.max(...weekAmounts, 1);

          // AI savings calc
          const overdueItems = unpaid.filter(p => p.days_overdue > 0);
          const lateFees = overdueItems.reduce((s, p) => s + p.amount_due * 0.06 * (p.days_overdue / 365), 0);
          const potentialSaving = Math.round(lateFees * 0.7);
          const cashReserve = Math.round(weekAmounts[0] * 1.15);

          return (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(212,168,67,0.2)',
              borderRadius: 12,
              padding: '24px',
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr 1fr',
              gap: 24,
            }}>
              {/* LEFT — Total Outstanding */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9CA3AF', marginBottom: 8 }}>
                  Dettes en cours
                </span>
                <p style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                  fontWeight: 200, fontSize: 48, letterSpacing: '-0.02em', lineHeight: 1,
                  color: '#D4A843', WebkitFontSmoothing: 'antialiased',
                }}>
                  {totalOutstanding.toLocaleString('fr-MA')}
                </p>
                <span style={{ fontSize: 14, fontFamily: 'ui-monospace', color: '#9CA3AF', marginTop: 4 }}>DH</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A843' }} />
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{unpaid.length} facture{unpaid.length !== 1 ? 's' : ''} en attente</span>
                </div>
              </div>

              {/* CENTER — 4-Week Forecast */}
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '0 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <TrendingDown size={14} color="#ef4444" />
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9CA3AF' }}>
                    Prévision sorties 4 semaines
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 90 }}>
                  {weekAmounts.map((amt, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        fontSize: 10, fontFamily: 'ui-monospace', color: amt > 0 ? '#ef4444' : '#3f3f46',
                        fontWeight: 500,
                      }}>
                        {amt > 0 ? `-${(amt / 1000).toFixed(0)}k` : '0'}
                      </span>
                      <div style={{
                        width: '100%', borderRadius: 4,
                        height: `${Math.max((amt / maxWeek) * 60, 4)}px`,
                        background: amt > 0 ? 'linear-gradient(180deg, rgba(239,68,68,0.6), rgba(239,68,68,0.2))' : 'rgba(255,255,255,0.03)',
                        transition: 'height 400ms ease',
                      }} />
                      <span style={{ fontSize: 9, color: '#6B7280', textTransform: 'uppercase' }}>S{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT — AI Recommendation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={14} color="#D4A843" />
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>
                    Recommandation IA
                  </span>
                </div>
                <div style={{
                  background: 'rgba(212,168,67,0.06)', borderRadius: 8, padding: '12px 14px',
                  border: '1px solid rgba(212,168,67,0.12)',
                }}>
                  <p style={{ fontSize: 12, color: '#D1D5DB', lineHeight: 1.5 }}>
                    Séquence optimale identifiée : économie de{' '}
                    <strong style={{ color: '#22c55e', fontFamily: 'ui-monospace' }}>{potentialSaving.toLocaleString('fr-MA')} DH</strong>{' '}
                    en pénalités de retard.
                  </p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '12px 14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Réserve trésorerie requise</span>
                  <p style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    fontSize: 18, fontWeight: 200, color: '#F1F5F9', marginTop: 4,
                  }}>
                    {cashReserve.toLocaleString('fr-MA')} <span style={{ fontSize: 12, color: '#6B7280' }}>DH</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* RÉSERVE TRÉSORERIE REQUISE */}
        {(() => {
          const unpaid = payables.filter(p => p.status !== 'paid');
          const due7 = unpaid.filter(p => p.days_until_due >= 0 && p.days_until_due <= 7).reduce((s, p) => s + p.amount_due, 0)
            + unpaid.filter(p => p.days_overdue > 0).reduce((s, p) => s + p.amount_due, 0);
          const due14 = unpaid.filter(p => p.days_until_due >= 0 && p.days_until_due <= 14).reduce((s, p) => s + p.amount_due, 0)
            + unpaid.filter(p => p.days_overdue > 0).reduce((s, p) => s + p.amount_due, 0);
          const due30 = unpaid.reduce((s, p) => s + p.amount_due, 0);
          const reserveNeeded = Math.round(due30 * 1.1);
          // Simulated current balance
          const currentBalance = 185000;
          const isCovered = currentBalance >= reserveNeeded;

          return (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '20px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={16} color="#D4A843" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>
                  Réserve Trésorerie Requise
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 18 }}>
                {[
                  { label: 'Prochains 7j', amount: due7, color: '#ef4444' },
                  { label: 'Prochains 14j', amount: due14, color: '#f59e0b' },
                  { label: 'Prochains 30j', amount: due30, color: '#D4A843' },
                ].map((period, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '12px 14px',
                    border: `1px solid ${period.color}20`,
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280' }}>{period.label}</span>
                    <p style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                      fontSize: 20, fontWeight: 200, color: period.color, letterSpacing: '-0.02em', marginTop: 4,
                    }}>
                      {period.amount.toLocaleString('fr-MA')} <span style={{ fontSize: 11, color: '#6B7280' }}>DH</span>
                    </p>
                  </div>
                ))}
              </div>

              <div style={{
                background: isCovered ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${isCovered ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                borderRadius: 8, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                {isCovered
                  ? <CheckCircle size={18} color="#22c55e" />
                  : <AlertTriangle size={18} color="#ef4444" className="animate-pulse" />
                }
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: '#D1D5DB', lineHeight: 1.5 }}>
                    Maintenir <strong style={{
                      fontFamily: 'ui-monospace', color: '#D4A843',
                    }}>{reserveNeeded.toLocaleString('fr-MA')} DH</strong> de réserve pour couvrir les échéances du mois.
                  </p>
                  <p style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                    Solde actuel : <span style={{ fontFamily: 'ui-monospace', color: isCovered ? '#22c55e' : '#ef4444' }}>{currentBalance.toLocaleString('fr-MA')} DH</span>
                    {isCovered ? ' — Couverture suffisante' : ' — Couverture insuffisante'}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {(() => {
          const agingBuckets = [
            { label: 'Courantes 0-30j', min: -Infinity, max: 30, color: '#D4A843', pulse: false },
            { label: '31-60j', min: 31, max: 60, color: '#f59e0b', pulse: false },
            { label: '61-90j', min: 61, max: 90, color: '#f97316', pulse: false },
            { label: '90j+', min: 91, max: Infinity, color: '#ef4444', pulse: true },
          ];
          const unpaid = payables.filter(p => p.status !== 'paid');
          const bucketData = agingBuckets.map(b => {
            const items = unpaid.filter(p => {
              const age = p.days_overdue > 0 ? p.days_overdue : 0;
              return age >= (b.min < 0 ? 0 : b.min) && age <= b.max;
            });
            // For 0-30j bucket, also include items not yet overdue
            const items030 = b.min === -Infinity
              ? unpaid.filter(p => p.days_overdue <= 30)
              : items;
            const finalItems = b.min === -Infinity ? items030 : items;
            return { ...b, count: finalItems.length, total: finalItems.reduce((s, p) => s + p.amount_due, 0) };
          });
          const maxTotal = Math.max(...bucketData.map(b => b.total), 1);
          return (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '20px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingDown size={16} color="#D4A843" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>Vieillissement des Dettes</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bucketData.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ width: 110, fontSize: 12, fontWeight: 500, color: b.color, flexShrink: 0 }}>{b.label}</span>
                    <div style={{ flex: 1, height: 28, background: 'rgba(255,255,255,0.03)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        width: `${Math.max((b.total / maxTotal) * 100, 2)}%`,
                        height: '100%',
                        background: `${b.color}30`,
                        borderLeft: `3px solid ${b.color}`,
                        borderRadius: 6,
                        transition: 'width 600ms ease',
                        animation: b.pulse && b.total > 0 ? 'tbos-pulse 2.5s infinite' : undefined,
                      }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: '#9CA3AF', minWidth: 70 }}>{b.count} facture{b.count !== 1 ? 's' : ''}</span>
                      <span style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                        fontSize: 14, fontWeight: 500, color: b.color, minWidth: 90, textAlign: 'right',
                      }}>
                        {b.total.toLocaleString('fr-MA')} DH
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* AGENT IA: ESCOMPTES DISPONIBLES */}
        {(() => {
          const unpaidAll = payables.filter(p => p.status !== 'paid' && p.days_until_due > 0);
          // Simulate early payment discount opportunities per supplier
          const discountData = [
            { supplier: 'LafargeHolcim Maroc', pct: 2, deadline: '2026-03-15', condition: '2% si payé avant 15 mars' },
            { supplier: 'Carrière Atlas Settat', pct: 1.5, deadline: '2026-03-20', condition: '1.5% si payé avant 20 mars' },
            { supplier: 'Ciments du Maroc', pct: 2.5, deadline: '2026-03-14', condition: '2.5% si payé avant 14 mars' },
            { supplier: 'ONEE', pct: 1, deadline: '2026-03-25', condition: '1% si payé avant 25 mars' },
          ];

          const today = new Date();
          const enriched = discountData.map(d => {
            const match = unpaidAll.find(p => p.fournisseur_name === d.supplier);
            if (!match) return null;
            const deadlineDate = new Date(d.deadline);
            const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / 86400000);
            const saving = Math.round(match.amount_due * d.pct / 100);
            return { ...d, amount: match.amount_due, saving, daysLeft };
          }).filter(Boolean) as { supplier: string; pct: number; deadline: string; condition: string; amount: number; saving: number; daysLeft: number }[];

          const totalSavings = enriched.reduce((s, e) => s + e.saving, 0);

          if (enriched.length === 0) return null;

          return (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: '3px solid #D4A843',
              borderRadius: 12,
              padding: '20px 24px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={16} color="#D4A843" />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>
                    Agent IA : Escomptes Disponibles
                  </span>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'tbos-pulse 2s infinite' }} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Économies potentielles ce mois</span>
                  <p style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                    fontSize: 22, fontWeight: 200, color: '#D4A843', letterSpacing: '-0.02em',
                  }}>{totalSavings.toLocaleString('fr-MA')} DH</p>
                </div>
              </div>

              {/* Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {enriched.map((item, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 100px 80px 150px',
                    gap: 12, padding: '12px 0', alignItems: 'center',
                    borderBottom: i < enriched.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#F1F5F9' }}>{item.supplier}</span>
                    <span style={{ fontSize: 12, color: '#D1D5DB', fontStyle: 'italic' }}>{item.condition}</span>
                    <span style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                      fontSize: 14, fontWeight: 500, color: '#D4A843', textAlign: 'right',
                    }}>
                      {item.saving.toLocaleString('fr-MA')} DH
                    </span>
                    <span style={{
                      fontFamily: 'ui-monospace', fontSize: 12, fontWeight: 600, textAlign: 'center',
                      color: item.daysLeft <= 5 ? '#ef4444' : item.daysLeft <= 10 ? '#f59e0b' : '#9CA3AF',
                      animation: item.daysLeft <= 5 ? 'tbos-pulse 2s infinite' : undefined,
                    }}>
                      {item.daysLeft}j
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button size="sm" style={{
                        fontSize: 11, fontWeight: 600,
                        background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)',
                        color: '#D4A843', borderRadius: 6, padding: '4px 12px', height: 28,
                      }}>
                        Profiter de l'escompte
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* CALENDRIER PAIEMENTS IA */}
        {(() => {
          const unpaid = payables.filter(p => p.status !== 'paid');
          const sorted = [...unpaid].sort((a, b) => a.days_until_due - b.days_until_due);
          const today = new Date();

          const getPriority = (p: Payable) => {
            if (p.days_overdue > 0 || p.days_until_due <= 3) return { label: 'URGENT', bg: 'rgba(239,68,68,0.15)', border: '#ef4444', color: '#ef4444', pulse: true };
            if (p.days_until_due <= 10) return { label: 'IMPORTANT', bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', color: '#f59e0b', pulse: false };
            return { label: 'PLANIFIÉ', bg: 'rgba(212,168,67,0.15)', border: '#D4A843', color: '#D4A843', pulse: false };
          };

          const totalOutflow = sorted.reduce((s, p) => s + p.amount_due, 0);

          // Group by week
          const weeks: { label: string; total: number }[] = [];
          for (let w = 0; w < 4; w++) {
            const weekItems = sorted.filter(p => {
              const dueDate = new Date(p.due_date);
              const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);
              return daysDiff >= w * 7 && daysDiff < (w + 1) * 7;
            });
            // Also include overdue in week 0
            const overdueInWeek = w === 0 ? sorted.filter(p => p.days_overdue > 0) : [];
            const combined = w === 0 ? [...new Set([...weekItems, ...overdueInWeek])] : weekItems;
            weeks.push({ label: `Semaine ${w + 1}`, total: combined.reduce((s, p) => s + p.amount_due, 0) });
          }

          return (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '20px 24px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CalendarDays size={16} color="#D4A843" />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>
                    Calendrier Paiements IA
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sortie totale 30j</span>
                    <p style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                      fontSize: 22, fontWeight: 200, color: '#ef4444', letterSpacing: '-0.02em', lineHeight: 1,
                    }}>-{totalOutflow.toLocaleString('fr-MA')} DH</p>
                  </div>
                  <Button size="sm" style={{
                    background: 'linear-gradient(135deg, #D4A843, #b8922e)',
                    color: '#000', fontWeight: 600, border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12,
                  }}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Approuver Tout
                  </Button>
                </div>
              </div>

              {/* Weekly impact */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                {weeks.map((w, i) => (
                  <div key={i} style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8,
                    background: w.total > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${w.total > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    <span style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{w.label}</span>
                    <p style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      fontSize: 14, fontWeight: 500,
                      color: w.total > 0 ? '#ef4444' : '#6B7280',
                    }}>
                      {w.total > 0 ? `-${w.total.toLocaleString('fr-MA')} DH` : '0 DH'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Timeline items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {sorted.slice(0, 8).map((p, i) => {
                  const priority = getPriority(p);
                  const recDate = p.days_overdue > 0
                    ? format(addDays(new Date(), 1 + i), 'dd MMM', { locale: dateLocale || undefined })
                    : format(parseISO(p.due_date), 'dd MMM', { locale: dateLocale || undefined });
                  return (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', padding: '10px 0',
                      borderBottom: i < sorted.slice(0, 8).length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      gap: 14,
                    }}>
                      {/* Timeline dot + line */}
                      <div style={{ width: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: priority.color, animation: priority.pulse ? 'tbos-pulse 2s infinite' : undefined }} />
                      </div>
                      {/* Date */}
                      <span style={{ fontSize: 12, fontFamily: 'ui-monospace', color: '#9CA3AF', width: 55, flexShrink: 0 }}>{recDate}</span>
                      {/* Supplier */}
                      <span style={{ flex: 1, fontSize: 13, color: '#F1F5F9', fontWeight: 500 }}>{p.fournisseur_name}</span>
                      {/* Amount */}
                      <span style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                        fontSize: 14, fontWeight: 500, color: '#D4A843', minWidth: 90, textAlign: 'right',
                      }}>
                        {p.amount_due.toLocaleString('fr-MA')} DH
                      </span>
                      {/* Priority badge */}
                      <span className={priority.pulse ? 'animate-pulse' : ''} style={{
                        fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                        background: priority.bg, border: `1px solid ${priority.border}`, color: priority.color,
                        letterSpacing: '0.05em', minWidth: 75, textAlign: 'center',
                      }}>
                        {priority.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex" style={{ gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { value: 'payables', label: d.allPayables, icon: FileText },
                { value: 'by-supplier', label: d.bySupplier, icon: Building2 },
                { value: 'calendar', label: d.calendar, icon: CalendarDays },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                      fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      background: isActive ? 'rgba(212,168,67,0.06)' : 'transparent',
                      color: isActive ? '#D4A843' : '#9CA3AF',
                      borderBottom: isActive ? '2px solid #D4A843' : '2px solid transparent',
                      borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget.style.color = '#F1F5F9'); }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget.style.color = '#9CA3AF'); }}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <Button
              size="sm"
              style={{
                background: 'linear-gradient(135deg, #D4A843, #b8922e)',
                color: '#000', fontWeight: 600, border: 'none',
                borderRadius: 8, padding: '8px 16px', fontSize: 13,
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Nouvelle Facture
            </Button>
          </div>

          {/* All Payables Tab */}
          <TabsContent value="payables" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#6B7280' }} />
                <Input
                  placeholder={d.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#F1F5F9',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#D4A843'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(212,168,67,0.3)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-[200px]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#F1F5F9',
                  }}
                >
                  <SelectValue placeholder={d.status} />
                </SelectTrigger>
                <SelectContent style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <SelectItem value="all">{d.allStatuses}</SelectItem>
                  <SelectItem value="not_due">{d.notDue}</SelectItem>
                  <SelectItem value="due_soon">{d.dueSoonLabel}</SelectItem>
                  <SelectItem value="due_today">{d.dueToday}</SelectItem>
                  <SelectItem value="overdue">{d.overdue}</SelectItem>
                  <SelectItem value="paid">{d.paid}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payables Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{d.supplier}</TableHead>
                      <TableHead>{d.invoice}</TableHead>
                      <TableHead>{d.dueDate}</TableHead>
                      <TableHead className="text-right">{d.amount}</TableHead>
                      <TableHead>{d.timeframe}</TableHead>
                      <TableHead>{d.status}</TableHead>
                      {canManagePayables && <TableHead>{d.actions}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayables.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManagePayables ? 7 : 6} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileText className="h-8 w-8" />
                            <p className="font-medium">{d.noPayables}</p>
                            <p className="text-sm">
                              {!hasData ? d.noPayablesNew : d.noPayablesFilter}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredPayables.slice(0, 50).map((payable) => {
                      const statusConfig = STATUS_CONFIG[payable.status];
                      return (
                        <TableRow 
                          key={payable.id}
                          className="group transition-all duration-150"
                          style={{ borderLeft: '3px solid transparent' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = '#D4A843'; (e.currentTarget as HTMLElement).style.background = 'rgba(255, 215, 0, 0.04)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{payable.fournisseur_name}</p>
                              {payable.payment_terms && (
                                <p className="text-xs text-muted-foreground">{payable.payment_terms}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {payable.invoice_number}
                          </TableCell>
                          <TableCell>
                            <span style={{
                              color: payable.days_overdue > 0 ? '#ef4444' : payable.days_until_due <= 7 ? '#f59e0b' : '#F1F5F9',
                              fontWeight: payable.days_overdue > 0 ? 500 : 400,
                            }}>
                              {format(parseISO(payable.due_date), 'dd MMM yyyy', { locale: dateLocale || undefined })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', color: '#D4A843', fontWeight: 500 }}>
                              {formatCurrency(payable.amount_due)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {payable.days_overdue > 0 ? (
                              <span style={{ color: '#ef4444', fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 13 }}>
                                +{payable.days_overdue}j
                              </span>
                            ) : (
                              <span style={{
                                color: payable.days_until_due > 14 ? '#22c55e' : payable.days_until_due > 7 ? '#f59e0b' : '#ef4444',
                                fontWeight: 500,
                                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                                fontSize: 13,
                              }}>
                                {payable.days_until_due}j
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", statusConfig.pulse && "animate-pulse")}
                              style={statusConfig.badgeStyle}
                            >
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </TableCell>
                          {canManagePayables && (
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {/* Mark as paid */}
                                {payable.status !== 'paid' && (
                                  <Button
                                    variant="ghost" size="icon" className="h-7 w-7"
                                    title="Marquer comme payé"
                                    onClick={() => {
                                      setSelectedPayable(payable);
                                      setPaymentAmount(payable.amount_due);
                                      setPaymentDialogOpen(true);
                                    }}
                                  >
                                    <Check className="h-3.5 w-3.5" style={{ color: '#22c55e' }} />
                                  </Button>
                                )}

                                {/* Contextual actions by status */}
                                {(payable.status === 'not_due') && (
                                  <>
                                    <Button
                                      size="sm" title="Programmer le paiement"
                                      style={{ fontSize: 11, fontWeight: 600, background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843', borderRadius: 6, padding: '4px 10px', height: 28 }}
                                      onClick={() => { setDrawerPayable(payable); setDrawerDate(parseISO(payable.due_date)); setDrawerMethod('virement'); setDrawerNote(''); setDrawerConfirmed(false); setDrawerOpen(true); }}
                                    >
                                      <CalendarDays className="h-3 w-3 mr-1" />
                                      Programmer
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Voir détails">
                                      <Eye className="h-3.5 w-3.5" style={{ color: '#9CA3AF' }} />
                                    </Button>
                                  </>
                                )}

                                {payable.status === 'overdue' && (
                                  <>
                                    <Button
                                      size="sm" title="Payer immédiatement"
                                      style={{ fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 6, padding: '4px 10px', height: 28 }}
                                      onClick={() => { setSelectedPayable(payable); setPaymentAmount(payable.amount_due); setPaymentDialogOpen(true); }}
                                    >
                                      <Banknote className="h-3 w-3 mr-1" />
                                      Payer maintenant
                                    </Button>
                                    <Button
                                      variant="ghost" size="sm" title="Négocier un délai"
                                      style={{ fontSize: 11, color: '#f59e0b', padding: '4px 8px', height: 28 }}
                                    >
                                      <Handshake className="h-3 w-3 mr-1" style={{ color: '#f59e0b' }} />
                                      Négocier
                                    </Button>
                                  </>
                                )}

                                {(payable.status === 'due_soon' || payable.status === 'due_today') && (
                                  <Button
                                    size="sm" className="animate-pulse" title="Paiement urgent requis"
                                    style={{ fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 6, padding: '4px 12px', height: 28 }}
                                    onClick={() => { setSelectedPayable(payable); setPaymentAmount(payable.amount_due); setPaymentDialogOpen(true); }}
                                  >
                                    <Zap className="h-3 w-3 mr-1" />
                                    URGENT — Payer
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Supplier Tab */}
          <TabsContent value="by-supplier" className="space-y-4">
            {/* SANTÉ RELATIONS FOURNISSEURS + CLASSEMENT */}
            {(() => {
              const ranked = [...payablesBySupplier].sort((a, b) => b.total_due - a.total_due);
              const topThreshold = ranked.length > 0 ? ranked[0].total_due * 0.5 : 0;

              // Compute AI health score per supplier
              const healthScores = new Map<string, number>();
              ranked.forEach(supplier => {
                const maxOverdue = Math.max(0, ...supplier.payables.map(p => p.days_overdue));
                const overdueRatio = supplier.total_due > 0 ? supplier.total_overdue / supplier.total_due : 0;
                // Punctuality (40%): penalize overdue days
                const punctuality = Math.max(0, 100 - maxOverdue * 1.5);
                // Dispute frequency (30%): proxy via overdue invoice ratio
                const overdueCount = supplier.payables.filter(p => p.status === 'overdue').length;
                const disputeScore = supplier.count > 0 ? Math.max(0, 100 - (overdueCount / supplier.count) * 100) : 100;
                // Contract compliance (30%): inverse of overdue amount ratio
                const complianceScore = Math.max(0, 100 - overdueRatio * 100);
                const score = Math.round(punctuality * 0.4 + disputeScore * 0.3 + complianceScore * 0.3);
                healthScores.set(supplier.fournisseur_name, Math.max(0, Math.min(100, score)));
              });
              const avgHealth = ranked.length > 0
                ? Math.round(Array.from(healthScores.values()).reduce((s, v) => s + v, 0) / ranked.length)
                : 0;
              const avgColor = avgHealth >= 80 ? '#22c55e' : avgHealth >= 60 ? '#f59e0b' : '#ef4444';

              return (
                <>
                {/* Average Health Score Card */}
                <div style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20,
                  borderLeft: '4px solid #D4A843',
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    border: `3px solid ${avgColor}`, background: `${avgColor}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                      fontSize: 24, fontWeight: 200, color: avgColor, letterSpacing: '-0.02em',
                      WebkitFontSmoothing: 'antialiased' as any,
                    }}>{avgHealth}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>
                        Santé Relations Fournisseurs
                      </span>
                      <span style={{ fontSize: 10, color: '#6B7280' }}>Score moyen</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>
                      Basé sur la ponctualité des paiements (40%), fréquence des litiges (30%) et conformité contractuelle (30%) sur 12 mois.
                    </p>
                  </div>
                  <div style={{
                    fontFamily: 'ui-monospace', fontSize: 48, fontWeight: 200,
                    color: '#D4A843', letterSpacing: '-0.02em', lineHeight: 1,
                    WebkitFontSmoothing: 'antialiased' as any,
                  }}>
                    {avgHealth}<span style={{ fontSize: 16, color: '#6B7280', fontWeight: 400 }}>/100</span>
                  </div>
                </div>

                <div style={{

                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '20px 24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={16} color="#D4A843" />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>
                      Classement Fournisseurs
                    </span>
                    <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 'auto' }}>{ranked.length} fournisseur{ranked.length !== 1 ? 's' : ''}</span>
                  </div>

                  {ranked.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280' }}>
                      <Building2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                      <p style={{ fontSize: 14, fontWeight: 500 }}>Aucune dette fournisseur</p>
                    </div>
                  ) : (
                    <div>
                      {/* Header row */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '32px 1fr 120px 70px 70px 80px 80px 140px',
                        gap: 8, padding: '8px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.15em', color: '#6B7280', borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <span>#</span>
                        <span>Fournisseur</span>
                        <span style={{ textAlign: 'right' }}>Total dû</span>
                        <span style={{ textAlign: 'center' }}>Factures</span>
                        <span style={{ textAlign: 'center' }}>Âge max</span>
                        <span style={{ textAlign: 'center' }}>Fiabilité</span>
                        <span style={{ textAlign: 'center' }}>Proch. éch.</span>
                        <span style={{ textAlign: 'center' }}>Statut IA</span>
                      </div>

                      {ranked.map((supplier, i) => {
                        const oldestAge = Math.max(...supplier.payables.map(p => Math.max(p.days_overdue, 0)));
                        const maxOverdue = Math.max(...supplier.payables.map(p => p.days_overdue));
                        const nextDue = supplier.payables
                          .filter(p => p.status !== 'paid')
                          .sort((a, b) => a.days_until_due - b.days_until_due)[0];
                        // AI reliability score based on overdue patterns
                        const reliabilityScore = Math.max(0, Math.min(100,
                          100 - (maxOverdue > 0 ? maxOverdue * 2 : 0) - (supplier.total_overdue / Math.max(supplier.total_due, 1)) * 30
                        ));
                        const reliabilityColor = reliabilityScore >= 80 ? '#22c55e' : reliabilityScore >= 50 ? '#f59e0b' : '#ef4444';
                        const isStrategic = supplier.total_due >= topThreshold;
                        const isRiskRelation = maxOverdue > 30;

                        return (
                          <div
                            key={supplier.fournisseur_name}
                            style={{
                              display: 'grid', gridTemplateColumns: '32px 1fr 120px 70px 70px 80px 80px 140px',
                              gap: 8, padding: '12px', alignItems: 'center',
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                              borderLeft: '3px solid transparent',
                              transition: 'all 150ms',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderLeftColor = '#D4A843'; e.currentTarget.style.background = 'rgba(255,215,0,0.04)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
                          >
                            {/* Rank */}
                            <span style={{
                              fontFamily: 'ui-monospace', fontSize: 14, fontWeight: 600,
                              color: i < 3 ? '#D4A843' : '#6B7280',
                            }}>
                              {i + 1}
                            </span>
                            {/* Supplier name with health score circle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <UITooltipProvider>
                                <UITooltip>
                                  <UITooltipTrigger asChild>
                                    <div style={{
                                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                      border: `2px solid ${(healthScores.get(supplier.fournisseur_name) || 0) >= 80 ? '#22c55e' : (healthScores.get(supplier.fournisseur_name) || 0) >= 60 ? '#f59e0b' : '#ef4444'}`,
                                      background: `${(healthScores.get(supplier.fournisseur_name) || 0) >= 80 ? '#22c55e' : (healthScores.get(supplier.fournisseur_name) || 0) >= 60 ? '#f59e0b' : '#ef4444'}15`,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      cursor: 'help',
                                    }}>
                                      <span style={{
                                        fontFamily: 'ui-monospace', fontSize: 9, fontWeight: 600,
                                        color: (healthScores.get(supplier.fournisseur_name) || 0) >= 80 ? '#22c55e' : (healthScores.get(supplier.fournisseur_name) || 0) >= 60 ? '#f59e0b' : '#ef4444',
                                      }}>{healthScores.get(supplier.fournisseur_name) || 0}</span>
                                    </div>
                                  </UITooltipTrigger>
                                  <UITooltipContent side="right">
                                    <p className="text-xs">Score basé sur 12 mois d'historique</p>
                                  </UITooltipContent>
                                </UITooltip>
                              </UITooltipProvider>
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#F1F5F9' }}>
                                {supplier.fournisseur_name}
                              </span>
                            </div>
                            {/* Total owed */}
                            <span style={{
                              fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                              fontSize: 14, fontWeight: 500, color: '#D4A843', textAlign: 'right',
                            }}>
                              {supplier.total_due.toLocaleString('fr-MA')} DH
                            </span>
                            {/* Invoice count */}
                            <span style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
                              {supplier.count}
                            </span>
                            {/* Oldest age */}
                            <span style={{
                              textAlign: 'center', fontFamily: 'ui-monospace', fontSize: 13,
                              color: oldestAge > 30 ? '#ef4444' : oldestAge > 14 ? '#f59e0b' : '#9CA3AF',
                            }}>
                              {oldestAge > 0 ? `${oldestAge}j` : '—'}
                            </span>
                            {/* Reliability score */}
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                border: `2px solid ${reliabilityColor}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 600, color: reliabilityColor,
                                fontFamily: 'ui-monospace',
                              }}>
                                {Math.round(reliabilityScore)}
                              </div>
                            </div>
                            {/* Next due */}
                            <span style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', fontFamily: 'ui-monospace' }}>
                              {nextDue ? format(parseISO(nextDue.due_date), 'dd/MM', { locale: dateLocale || undefined }) : '—'}
                            </span>
                            {/* AI badge */}
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              {isRiskRelation ? (
                                <span className="animate-pulse" style={{
                                  fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                                  background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444',
                                  whiteSpace: 'nowrap',
                                }}>
                                  Risque relation
                                </span>
                              ) : isStrategic ? (
                                <span style={{
                                  fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                                  background: 'rgba(212,168,67,0.15)', border: '1px solid #D4A843', color: '#D4A843',
                                  whiteSpace: 'nowrap',
                                }}>
                                  Fournisseur stratégique
                                </span>
                              ) : (
                                <span style={{ fontSize: 10, color: '#6B7280' }}>—</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                </>
              );
            })()}

            {/* RISQUE DE CONCENTRATION */}
            {(() => {
              const ranked = [...payablesBySupplier].sort((a, b) => b.total_due - a.total_due);
              const grandTotal = ranked.reduce((s, r) => s + r.total_due, 0) || 1;
              const sliceColors = ['#D4A843', '#f59e0b', '#4A9EFF', '#22c55e', '#f97316', '#a78bfa', '#ec4899', '#6B7280'];
              const slices = ranked.map((s, i) => ({
                name: s.fournisseur_name,
                pct: (s.total_due / grandTotal) * 100,
                amount: s.total_due,
                color: sliceColors[i % sliceColors.length],
                isRisk: (s.total_due / grandTotal) * 100 > 30,
              }));
              const topSupplier = slices[0];

              // Build SVG donut
              const size = 180, cx = size / 2, cy = size / 2, r = 65, strokeW = 22;
              let cumAngle = -90;
              const arcs = slices.map(s => {
                const angle = (s.pct / 100) * 360;
                const startAngle = cumAngle;
                cumAngle += angle;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = ((startAngle + angle) * Math.PI) / 180;
                const largeArc = angle > 180 ? 1 : 0;
                const x1 = cx + r * Math.cos(startRad);
                const y1 = cy + r * Math.sin(startRad);
                const x2 = cx + r * Math.cos(endRad);
                const y2 = cy + r * Math.sin(endRad);
                return { ...s, d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}` };
              });

              return (
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '20px 24px',
                  marginTop: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={16} color="#D4A843" />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>
                      Risque de Concentration
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 28, alignItems: 'center' }}>
                    {/* Donut */}
                    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
                      <svg width={size} height={size}>
                        {/* Background ring */}
                        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeW} />
                        {arcs.map((arc, i) => (
                          <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth={strokeW}
                            strokeLinecap="butt" style={{ filter: arc.isRisk ? 'drop-shadow(0 0 6px rgba(239,68,68,0.4))' : undefined }} />
                        ))}
                      </svg>
                      {/* Center label */}
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{
                          fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                          fontSize: 18, fontWeight: 200, color: '#F1F5F9',
                        }}>{grandTotal.toLocaleString('fr-MA')}</span>
                        <span style={{ fontSize: 10, color: '#6B7280' }}>DH</span>
                      </div>
                    </div>

                    {/* Legend + rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {slices.map((s, i) => (
                        <div key={i} style={{
                          display: 'grid', gridTemplateColumns: '12px 1fr 70px 60px 130px',
                          gap: 10, alignItems: 'center', padding: '6px 8px', borderRadius: 6,
                          background: s.isRisk ? 'rgba(239,68,68,0.06)' : 'transparent',
                        }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                          <span style={{ fontSize: 12, color: '#F1F5F9', fontWeight: 500 }}>{s.name}</span>
                          <span style={{
                            fontFamily: 'ui-monospace', fontSize: 12, fontWeight: 500, color: '#D4A843', textAlign: 'right',
                          }}>{s.pct.toFixed(1)}%</span>
                          <span style={{
                            fontFamily: 'ui-monospace', fontSize: 11, color: '#9CA3AF', textAlign: 'right',
                          }}>{(s.amount / 1000).toFixed(0)}k</span>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {s.isRisk && (
                              <span className="animate-pulse" style={{
                                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                                background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444',
                                whiteSpace: 'nowrap',
                              }}>Risque concentration élevé</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Insight */}
                  {topSupplier && (
                    <div style={{
                      marginTop: 16, padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(212,168,67,0.04)', borderLeft: '2px solid rgba(212,168,67,0.3)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <Zap size={14} color="#D4A843" style={{ flexShrink: 0 }} />
                      <p style={{ fontSize: 12, color: '#D1D5DB', lineHeight: 1.5 }}>
                        <strong style={{ color: '#F1F5F9' }}>{topSupplier.name}</strong> représente{' '}
                        <strong style={{ color: '#D4A843', fontFamily: 'ui-monospace' }}>{topSupplier.pct.toFixed(0)}%</strong> de vos dettes
                        {topSupplier.pct > 25 ? ' — diversification recommandée.' : ' — concentration acceptable.'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* AGENT IA: NÉGOCIATION FOURNISSEURS */}
            {(() => {
              const overdueSuppliers = payablesBySupplier.filter(s => s.total_overdue > 0);
              if (overdueSuppliers.length === 0) return null;

              const getNegoData = (supplier: typeof overdueSuppliers[0]) => {
                const maxOverdue = Math.max(...supplier.payables.map(p => p.days_overdue));
                const riskLevel = maxOverdue > 60 ? 'Élevé' : maxOverdue > 20 ? 'Moyen' : 'Faible';
                const riskColor = riskLevel === 'Élevé' ? '#ef4444' : riskLevel === 'Moyen' ? '#f59e0b' : '#22c55e';
                const extensionProb = Math.max(15, Math.min(85, 90 - maxOverdue * 1.2));
                const suggestedPartial = Math.round(supplier.total_overdue * (maxOverdue > 30 ? 0.6 : 0.4));
                const scripts: Record<string, string> = {
                  'Élevé': `Bonjour, nous souhaitons régulariser notre situation et proposons un échéancier immédiat de ${suggestedPartial.toLocaleString('fr-MA')} DH en premier versement.`,
                  'Moyen': `Bonjour, nous préparons le règlement et souhaiterions convenir d'un calendrier de paiement adapté pour les ${supplier.total_overdue.toLocaleString('fr-MA')} DH en cours.`,
                  'Faible': `Bonjour, le règlement de ${supplier.total_overdue.toLocaleString('fr-MA')} DH est en cours de traitement, nous confirmons le paiement sous 48h.`,
                };
                return { riskLevel, riskColor, extensionProb: Math.round(extensionProb), suggestedPartial, script: scripts[riskLevel], maxOverdue };
              };

              return (
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: '3px solid #D4A843',
                  borderRadius: 12,
                  padding: '20px 24px',
                  marginTop: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Handshake size={16} color="#D4A843" />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>
                      Agent IA : Négociation Fournisseurs
                    </span>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'tbos-pulse 2s infinite', marginLeft: 4 }} />
                    <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 'auto' }}>{overdueSuppliers.length} fournisseur{overdueSuppliers.length !== 1 ? 's' : ''} en retard</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {overdueSuppliers.map(supplier => {
                      const nego = getNegoData(supplier);
                      const isExpanded = expandedNego[supplier.fournisseur_name] || false;

                      return (
                        <div key={supplier.fournisseur_name}>
                          {/* Row header */}
                          <div
                            onClick={() => setExpandedNego(prev => ({ ...prev, [supplier.fournisseur_name]: !prev[supplier.fournisseur_name] }))}
                            style={{
                              display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px 30px',
                              gap: 12, padding: '12px 14px', alignItems: 'center', cursor: 'pointer',
                              borderRadius: 8, transition: 'background 150ms',
                              background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                            }}
                            onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(255,215,0,0.04)'; }}
                            onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#F1F5F9' }}>{supplier.fournisseur_name}</span>
                              <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 10 }}>+{nego.maxOverdue}j retard</span>
                            </div>
                            <span style={{ fontFamily: 'ui-monospace', fontSize: 13, color: '#ef4444', textAlign: 'right' }}>
                              {supplier.total_overdue.toLocaleString('fr-MA')} DH
                            </span>
                            <div style={{ textAlign: 'center' }}>
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                                background: `${nego.riskColor}20`, color: nego.riskColor, border: `1px solid ${nego.riskColor}40`,
                              }}>
                                {nego.riskLevel}
                              </span>
                            </div>
                            <span style={{ fontFamily: 'ui-monospace', fontSize: 12, color: '#D4A843', textAlign: 'center' }}>
                              {nego.extensionProb}%
                            </span>
                            <span style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', transition: 'transform 200ms', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                              ▾
                            </span>
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div style={{
                              padding: '14px 18px', margin: '0 8px 8px',
                              background: 'rgba(212,168,67,0.04)', borderRadius: 8,
                              border: '1px solid rgba(212,168,67,0.1)',
                              display: 'flex', flexDirection: 'column', gap: 12,
                            }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                <div>
                                  <span style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Probabilité extension</span>
                                  <p style={{ fontFamily: 'ui-monospace', fontSize: 22, fontWeight: 200, color: nego.extensionProb > 50 ? '#22c55e' : '#f59e0b', marginTop: 4 }}>
                                    {nego.extensionProb}<span style={{ fontSize: 12, color: '#6B7280' }}>%</span>
                                  </p>
                                </div>
                                <div>
                                  <span style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paiement partiel suggéré</span>
                                  <p style={{ fontFamily: 'ui-monospace', fontSize: 22, fontWeight: 200, color: '#D4A843', marginTop: 4 }}>
                                    {nego.suggestedPartial.toLocaleString('fr-MA')} <span style={{ fontSize: 12, color: '#6B7280' }}>DH</span>
                                  </p>
                                </div>
                                <div>
                                  <span style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Risque relation</span>
                                  <p style={{ fontSize: 16, fontWeight: 600, color: nego.riskColor, marginTop: 6 }}>{nego.riskLevel}</p>
                                </div>
                              </div>
                              <div>
                                <span style={{ fontSize: 10, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                  <Zap size={12} color="#D4A843" />
                                  Script d'appel recommandé
                                </span>
                                <p style={{
                                  fontSize: 12, color: '#D1D5DB', lineHeight: 1.6,
                                  background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '10px 14px',
                                  borderLeft: '2px solid rgba(212,168,67,0.3)', fontStyle: 'italic',
                                }}>
                                  "{nego.script}"
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            {(() => {
              const year = 2026, month = 2; // March 2026 (0-indexed)
              const firstDay = new Date(year, month, 1);
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday start
              const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
              const today = new Date();

              // Map payments by day
              const unpaid = payables.filter(p => p.status !== 'paid');
              const byDay: Record<number, { suppliers: string[]; total: number; isOverdue: boolean; isScheduled: boolean }> = {};
              unpaid.forEach(p => {
                const d = new Date(p.due_date);
                if (d.getFullYear() === year && d.getMonth() === month) {
                  const day = d.getDate();
                  if (!byDay[day]) byDay[day] = { suppliers: [], total: 0, isOverdue: false, isScheduled: false };
                  byDay[day].suppliers.push(p.fournisseur_name);
                  byDay[day].total += p.amount_due;
                  if (p.days_overdue > 0) byDay[day].isOverdue = true;
                }
              });
              // Mark scheduled (demo: payments already due_soon get gold dot)
              unpaid.filter(p => p.status === 'due_soon' || p.status === 'not_due').forEach(p => {
                const d = new Date(p.due_date);
                if (d.getFullYear() === year && d.getMonth() === month) {
                  const day = d.getDate();
                  if (byDay[day]) byDay[day].isScheduled = true;
                }
              });

              // Build calendar grid with weeks
              const weeks: (number | null)[][] = [];
              let currentWeek: (number | null)[] = [];
              for (let i = 0; i < startDow; i++) currentWeek.push(null);
              for (let d = 1; d <= daysInMonth; d++) {
                currentWeek.push(d);
                if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
              }
              if (currentWeek.length > 0) {
                while (currentWeek.length < 7) currentWeek.push(null);
                weeks.push(currentWeek);
              }

              const monthTotal = Object.values(byDay).reduce((s, d) => s + d.total, 0);

              return (
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '20px 24px',
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CalendarDays size={16} color="#D4A843" />
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#F1F5F9' }}>Mars 2026</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total mois</span>
                      <p style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                        fontSize: 20, fontWeight: 200, color: '#D4A843', letterSpacing: '-0.02em',
                      }}>{monthTotal.toLocaleString('fr-MA')} DH</p>
                    </div>
                  </div>

                  {/* Day names header */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                    {dayNames.map(dn => (
                      <div key={dn} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 0' }}>
                        {dn}
                      </div>
                    ))}
                  </div>

                  {/* Weeks */}
                  {weeks.map((week, wi) => {
                    const weekTotal = week.reduce((s, d) => s + (d && byDay[d] ? byDay[d].total : 0), 0);
                    return (
                      <div key={wi}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                          {week.map((day, di) => {
                            if (day === null) return <div key={di} style={{ height: 64 }} />;
                            const info = byDay[day];
                            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                            const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                            return (
                              <div
                                key={di}
                                title={info ? `${info.suppliers.join(', ')}\n${info.total.toLocaleString('fr-MA')} DH` : undefined}
                                style={{
                                  height: 64, borderRadius: 8, padding: '6px 8px',
                                  background: info?.isOverdue
                                    ? 'rgba(239,68,68,0.1)'
                                    : isToday ? 'rgba(212,168,67,0.08)' : 'rgba(255,255,255,0.02)',
                                  border: isToday ? '1px solid rgba(212,168,67,0.3)' : '1px solid rgba(255,255,255,0.04)',
                                  animation: info?.isOverdue ? 'tbos-pulse 2.5s infinite' : undefined,
                                  position: 'relative',
                                  cursor: info ? 'pointer' : 'default',
                                  transition: 'background 150ms',
                                }}
                              >
                                <span style={{
                                  fontSize: 12, fontWeight: isToday ? 700 : 400,
                                  color: isPast && !isToday ? '#6B7280' : isToday ? '#D4A843' : '#F1F5F9',
                                }}>{day}</span>
                                {info && (
                                  <div style={{ position: 'absolute', bottom: 6, left: 8, right: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <div style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        background: info.isOverdue ? '#ef4444' : info.isScheduled ? '#D4A843' : '#ef4444',
                                        animation: info.isOverdue ? 'tbos-pulse 2s infinite' : undefined,
                                      }} />
                                      <span style={{
                                        fontSize: 10, fontFamily: 'ui-monospace', fontWeight: 500,
                                        color: info.isOverdue ? '#ef4444' : '#D4A843',
                                      }}>
                                        {info.total >= 1000 ? `${(info.total / 1000).toFixed(0)}k` : info.total}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {/* Weekly total */}
                        <div style={{
                          textAlign: 'right', padding: '4px 8px 8px', fontSize: 11,
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          color: weekTotal > 0 ? '#D4A843' : '#3f3f46',
                        }}>
                          {weekTotal > 0 ? `Sem. ${wi + 1}: ${weekTotal.toLocaleString('fr-MA')} DH` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{d.registerPayment}</DialogTitle>
            </DialogHeader>
            {selectedPayable && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-medium">{selectedPayable.fournisseur_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {d.invoice}: {selectedPayable.invoice_number}
                  </p>
                  <p className="text-lg font-bold mt-2">
                    {d.balanceDue}: {formatCurrency(selectedPayable.amount_due)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>{d.paymentAmount}</Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{d.paymentMode}</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virement">{d.bankTransfer}</SelectItem>
                        <SelectItem value="cheque">{d.check}</SelectItem>
                        <SelectItem value="especes">{d.cash}</SelectItem>
                        <SelectItem value="effet">{d.billOfExchange}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{d.reference}</Label>
                    <Input
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder={d.referencePlaceholder}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                {d.cancel}
              </Button>
              <Button 
                onClick={handleExecutePayment}
                disabled={processingAction || paymentAmount <= 0}
              >
                {processingAction ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {d.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Premium Payment Drawer */}
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => { setDrawerOpen(false); setDrawerConfirmed(false); }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                zIndex: 9998, transition: 'opacity 300ms',
              }}
            />
            {/* Drawer Panel */}
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
              background: '#0F1629', borderLeft: '4px solid #D4A843',
              zIndex: 9999, overflowY: 'auto',
              animation: 'slideInRight 300ms ease-out',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Header */}
              <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D4A843' }}>
                    Programmer un Paiement
                  </span>
                  <button
                    onClick={() => { setDrawerOpen(false); setDrawerConfirmed(false); }}
                    style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 20, cursor: 'pointer' }}
                  >✕</button>
                </div>

                {drawerPayable && !drawerConfirmed && (
                  <>
                    {/* Supplier info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 10,
                        background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Building2 size={22} color="#D4A843" />
                      </div>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#F1F5F9' }}>{drawerPayable.fournisseur_name}</p>
                        <p style={{ fontSize: 12, fontFamily: 'ui-monospace', color: '#9CA3AF' }}>{drawerPayable.invoice_number}</p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{
                      background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '20px 24px',
                      border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', marginBottom: 4,
                    }}>
                      <span style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Montant à régler</span>
                      <p style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                        fontWeight: 200, fontSize: 48, letterSpacing: '-0.02em', lineHeight: 1,
                        color: '#D4A843', WebkitFontSmoothing: 'antialiased', marginTop: 8,
                      }}>
                        {drawerPayable.amount_due.toLocaleString('fr-MA')}
                      </p>
                      <span style={{ fontSize: 14, fontFamily: 'ui-monospace', color: '#6B7280' }}>DH</span>
                    </div>
                  </>
                )}
              </div>

              {drawerPayable && !drawerConfirmed && (
                <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Payment Method */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10, display: 'block' }}>
                      Mode de paiement
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { value: 'virement', label: 'Virement', icon: '🏦' },
                        { value: 'cheque', label: 'Chèque', icon: '📝' },
                        { value: 'traite', label: 'Traite', icon: '📄' },
                      ].map(m => (
                        <div
                          key={m.value}
                          onClick={() => setDrawerMethod(m.value)}
                          style={{
                            flex: 1, padding: '14px 12px', borderRadius: 10, cursor: 'pointer',
                            background: drawerMethod === m.value ? 'rgba(212,168,67,0.08)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${drawerMethod === m.value ? '#D4A843' : 'rgba(255,255,255,0.08)'}`,
                            textAlign: 'center', transition: 'all 200ms',
                          }}
                        >
                          <span style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>{m.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: drawerMethod === m.value ? '#D4A843' : '#9CA3AF' }}>{m.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Date Picker */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10, display: 'block' }}>
                      Date de paiement
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !drawerDate && "text-muted-foreground")}
                          style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8, color: '#F1F5F9', height: 44,
                          }}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" style={{ color: '#D4A843' }} />
                          {drawerDate ? format(drawerDate, "dd MMMM yyyy", { locale: dateLocale || undefined }) : 'Sélectionner une date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={drawerDate}
                          onSelect={setDrawerDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Note */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10, display: 'block' }}>
                      Note (optionnel)
                    </label>
                    <textarea
                      value={drawerNote}
                      onChange={e => setDrawerNote(e.target.value)}
                      placeholder="Référence, commentaire..."
                      rows={3}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                        color: '#F1F5F9', padding: '10px 14px', fontSize: 13,
                        resize: 'none', outline: 'none', fontFamily: 'inherit',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#D4A843'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    />
                  </div>

                  {/* Invoice details */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '12px 14px',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: '#6B7280' }}>Échéance originale</span>
                      <span style={{ color: '#F1F5F9', fontFamily: 'ui-monospace' }}>
                        {format(parseISO(drawerPayable.due_date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: '#6B7280' }}>Statut</span>
                      <span style={{ color: drawerPayable.days_overdue > 0 ? '#ef4444' : '#f59e0b' }}>
                        {drawerPayable.days_overdue > 0 ? `+${drawerPayable.days_overdue}j retard` : `${drawerPayable.days_until_due}j restants`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#6B7280' }}>Mode choisi</span>
                      <span style={{ color: '#D4A843', textTransform: 'capitalize' }}>{drawerMethod}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmed state */}
              {drawerConfirmed && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <div className="animate-pulse" style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckCircle size={40} color="#22c55e" />
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 600, color: '#F1F5F9' }}>Paiement programmé</p>
                  <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', maxWidth: 280 }}>
                    {drawerPayable?.fournisseur_name} — {drawerPayable?.amount_due.toLocaleString('fr-MA')} DH
                    {drawerDate && ` le ${format(drawerDate, 'dd/MM/yyyy')}`}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => { setDrawerOpen(false); setDrawerConfirmed(false); }}
                    style={{ marginTop: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', borderRadius: 8 }}
                  >
                    Fermer
                  </Button>
                </div>
              )}

              {/* Footer */}
              {!drawerConfirmed && (
                <div style={{
                  padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', gap: 12,
                }}>
                  <Button
                    variant="ghost"
                    onClick={() => { setDrawerOpen(false); setDrawerConfirmed(false); }}
                    style={{ flex: 1, color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                  >
                    Annuler
                  </Button>
                  <Button
                    disabled={!drawerDate}
                    onClick={() => setDrawerConfirmed(true)}
                    style={{
                      flex: 2, background: 'linear-gradient(135deg, #D4A843, #b8922e)',
                      color: '#000', fontWeight: 700, border: 'none', borderRadius: 8,
                      opacity: drawerDate ? 1 : 0.5,
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmer Paiement
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
      </div>
    </MainLayout>
  );
}
