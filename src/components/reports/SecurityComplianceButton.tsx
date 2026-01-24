import { useState } from 'react';
import { Shield, FileText, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { openSecurityCompliancePdf } from '@/lib/securityCompliancePdf';
import { toast } from 'sonner';

interface RlsPolicy {
  tablename: string;
  policyname: string;
  cmd: string;
  roles: string;
  qual: string | null;
}

interface SecurityFunction {
  name: string;
  type: string;
  securityType: string;
}

interface RoleCount {
  role: string;
  count: number;
}

export function SecurityComplianceButton() {
  const { isCeo, isSuperviseur, isAuditeur } = useAuth();
  const [loading, setLoading] = useState(false);

  const canGenerate = isCeo || isSuperviseur || isAuditeur;

  const handleGenerateReport = async () => {
    if (!canGenerate) {
      toast.error('Accès refusé: Réservé CEO/Superviseur/Auditeur');
      return;
    }

    setLoading(true);
    toast.info('Génération du rapport de conformité...', { duration: 2000 });

    try {
      // Fetch RLS policies
      const { data: policiesData } = await supabase.rpc('get_rls_policies_for_report');
      
      // Fetch security functions
      const { data: functionsData } = await supabase.rpc('get_security_functions_for_report');
      
      // Fetch role distribution
      const { data: rolesData } = await supabase
        .from('user_roles_v2')
        .select('role')
        .then(res => {
          if (!res.data) return { data: [] };
          const counts: Record<string, number> = {};
          res.data.forEach(r => {
            counts[r.role] = (counts[r.role] || 0) + 1;
          });
          return {
            data: Object.entries(counts).map(([role, count]) => ({ role, count }))
          };
        });

      // Transform data for PDF
      const policies: RlsPolicy[] = (policiesData as any[] || []).map(p => ({
        tablename: p.tablename,
        policyname: p.policyname,
        cmd: p.cmd,
        roles: p.roles || '{authenticated}',
        qual: p.qual
      }));

      const functions: SecurityFunction[] = (functionsData as any[] || []).map(f => ({
        name: f.routine_name,
        type: f.routine_type,
        securityType: f.security_type
      }));

      const roles: RoleCount[] = rolesData as RoleCount[] || [];

      // Generate PDF
      openSecurityCompliancePdf(policies, functions, roles);
      
      toast.success('Rapport de conformité généré avec succès');
    } catch (error) {
      console.error('Error generating security report:', error);
      
      // Fallback: generate with default data
      openSecurityCompliancePdf();
      toast.success('Rapport généré (données par défaut)');
    } finally {
      setLoading(false);
    }
  };

  if (!canGenerate) return null;

  return (
    <Button
      onClick={handleGenerateReport}
      disabled={loading}
      variant="outline"
      className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Shield className="h-4 w-4 text-primary" />
      )}
      <span className="hidden sm:inline">Rapport Conformité</span>
      <Download className="h-3 w-3 opacity-50" />
    </Button>
  );
}
