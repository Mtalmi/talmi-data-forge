import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2, Clock, AlertTriangle, XCircle,
  FileText, Shield, Banknote, Users, Building,
  Calendar, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format, differenceInDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RegulatoryItem {
  id: string;
  category: string;
  label: string;
  description: string;
  dueDate: string | null;
  status: 'compliant' | 'pending' | 'overdue' | 'upcoming';
  icon: React.ElementType;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Moroccan regulatory obligations
const REGULATORY_CATEGORIES = [
  { id: 'rls', label: 'Sécurité BDD', icon: Shield, description: 'Row-Level Security activé sur toutes les tables' },
  { id: 'audit_trail', label: 'Piste d\'Audit', icon: FileText, description: 'Traçabilité complète des modifications' },
  { id: 'receipts', label: 'Justificatifs', icon: Banknote, description: 'Preuves photo obligatoires pour dépenses' },
  { id: 'signatures', label: 'Signatures BL', icon: Users, description: 'Signature client sur bons de livraison' },
  { id: 'contracts', label: 'Contrats Fournisseurs', icon: Building, description: 'Couverture contractuelle des prestataires' },
  { id: 'quality', label: 'Contrôles Qualité', icon: Shield, description: 'Tests qualité sur production' },
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'compliant': return CheckCircle2;
    case 'pending': return Clock;
    case 'upcoming': return Bell;
    case 'overdue': return XCircle;
    default: return AlertTriangle;
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'compliant': return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Conforme' };
    case 'pending': return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'En cours' };
    case 'upcoming': return { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'À venir' };
    case 'overdue': return { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', label: 'En retard' };
    default: return { text: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-border', label: 'Inconnu' };
  }
}

export function RegulatoryChecklistWidget() {
  const [items, setItems] = useState<RegulatoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChecklist = useCallback(async () => {
    try {
      // Fetch compliance data in parallel
      const [expenseRes, blRes, contractRes, auditRes] = await Promise.all([
        supabase
          .from('expenses_controlled')
          .select('id, receipt_photo_url')
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase
          .from('bons_livraison_reels')
          .select('bl_id, validated_at, client_signature_url, quality_status')
          .gte('date_livraison', format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd')),
        supabase
          .from('contract_compliance_summary')
          .select('fournisseur_id, active_contracts, has_active_contract')
          .limit(50),
        supabase
          .from('audits_externes')
          .select('compliance_score, submitted_at')
          .eq('status', 'submitted')
          .order('submitted_at', { ascending: false })
          .limit(1),
      ]);

      const expenses = expenseRes.data || [];
      const bls = blRes.data || [];
      const contracts = contractRes.data || [];

      const receiptRate = expenses.length > 0
        ? (expenses.filter(e => e.receipt_photo_url).length / expenses.length) * 100
        : 100;

      const signatureRate = bls.length > 0
        ? (bls.filter(b => b.client_signature_url).length / bls.length) * 100
        : 100;

      const qualityRate = bls.length > 0
        ? (bls.filter(b => b.quality_status).length / bls.length) * 100
        : 100;

      const withoutContract = (contracts as any[]).filter((c: any) => !c.has_active_contract).length;

      const regulatoryItems: RegulatoryItem[] = [
        {
          id: 'rls',
          category: 'Sécurité',
          label: 'Row-Level Security',
          description: 'Protection des données par rôle utilisateur',
          dueDate: null,
          status: 'compliant', // Always compliant - enforced by architecture
          icon: Shield,
          priority: 'high',
        },
        {
          id: 'audit_trail',
          category: 'Traçabilité',
          label: 'Piste d\'Audit Forensic',
          description: 'Triggers automatiques sur toutes les tables critiques',
          dueDate: null,
          status: 'compliant',
          icon: FileText,
          priority: 'high',
        },
        {
          id: 'receipts',
          category: 'Finance',
          label: 'Justificatifs Dépenses',
          description: `${receiptRate.toFixed(0)}% des dépenses avec preuve photo`,
          dueDate: format(addDays(new Date(), 0), 'yyyy-MM-dd'),
          status: receiptRate >= 95 ? 'compliant' : receiptRate >= 80 ? 'pending' : 'overdue',
          icon: Banknote,
          priority: receiptRate < 80 ? 'critical' : receiptRate < 95 ? 'high' : 'low',
        },
        {
          id: 'signatures',
          category: 'Logistique',
          label: 'Signatures Clients BL',
          description: `${signatureRate.toFixed(0)}% des BL signés`,
          dueDate: null,
          status: signatureRate >= 90 ? 'compliant' : signatureRate >= 70 ? 'pending' : 'overdue',
          icon: Users,
          priority: signatureRate < 70 ? 'high' : 'medium',
        },
        {
          id: 'contracts',
          category: 'Juridique',
          label: 'Contrats Fournisseurs',
          description: withoutContract > 0 
            ? `${withoutContract} fournisseur(s) sans contrat actif`
            : 'Tous les fournisseurs ont un contrat',
          dueDate: null,
          status: withoutContract === 0 ? 'compliant' : withoutContract <= 1 ? 'upcoming' : 'overdue',
          icon: Building,
          priority: withoutContract > 1 ? 'high' : 'low',
        },
        {
          id: 'quality',
          category: 'Production',
          label: 'Contrôles Qualité',
          description: `${qualityRate.toFixed(0)}% des lots vérifiés`,
          dueDate: null,
          status: qualityRate >= 90 ? 'compliant' : qualityRate >= 70 ? 'pending' : 'overdue',
          icon: Shield,
          priority: qualityRate < 70 ? 'critical' : 'medium',
        },
      ];

      // Sort: overdue first, then pending, then upcoming, then compliant
      const sortOrder = { overdue: 0, pending: 1, upcoming: 2, compliant: 3 };
      regulatoryItems.sort((a, b) => sortOrder[a.status] - sortOrder[b.status]);

      setItems(regulatoryItems);
    } catch (err) {
      console.error('[Regulatory] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-16 rounded-lg bg-muted/30" />)}
      </div>
    );
  }

  const compliantCount = items.filter(i => i.status === 'compliant').length;
  const totalCount = items.length;
  const complianceRate = Math.round((compliantCount / totalCount) * 100);

  return (
    <div className="space-y-3">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            Checklist Réglementaire
          </h3>
          <p className="text-xs text-muted-foreground">{compliantCount}/{totalCount} conformes</p>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            'text-xs font-bold',
            complianceRate >= 80 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
            complianceRate >= 60 ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
            'bg-destructive/10 text-destructive border-destructive/30'
          )}
        >
          {complianceRate}%
        </Badge>
      </div>

      <Progress value={complianceRate} className="h-2" />

      {/* Checklist Items */}
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const style = getStatusStyle(item.status);
          const StatusIcon = getStatusIcon(item.status);

          return (
            <motion.div
              key={item.id}
              initial={{ x: -8, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg border transition-colors',
                style.bg, style.border
              )}
            >
              <StatusIcon className={cn('h-4 w-4 shrink-0', style.text)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{item.label}</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">{item.category}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
              </div>
              <Badge variant="outline" className={cn('text-[10px] shrink-0', style.text, style.border)}>
                {style.label}
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
