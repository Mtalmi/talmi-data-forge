import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Award
} from 'lucide-react';
import { TRAINING_STEPS } from '@/hooks/useTrainingProgress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StaffMember {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  completedSteps: number;
  totalSteps: number;
  isCertified: boolean;
  certifiedAt?: string;
  lastActivity?: string;
}

export function TrainingMonitor() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaffTraining = useCallback(async () => {
    setLoading(true);
    try {
      // Get all users with roles
      const { data: usersWithRoles, error: rolesError } = await supabase
        .from('user_roles_v2')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name');

      // Get training progress for all users
      const { data: progressData } = await supabase
        .from('user_training_progress')
        .select('user_id, step_id, completed_at');

      // Get certifications
      const { data: certifications } = await supabase
        .from('user_certifications')
        .select('user_id, certified_at, badge_level');

      // Build staff member list
      const staffList: StaffMember[] = (usersWithRoles || []).map(ur => {
        const profile = profiles?.find(p => p.user_id === ur.user_id);
        const userProgress = progressData?.filter(p => p.user_id === ur.user_id) || [];
        const certification = certifications?.find(c => c.user_id === ur.user_id);

        const lastProgress = userProgress.sort((a, b) => 
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        )[0];

        return {
          userId: ur.user_id,
          email: profile?.email || 'N/A',
          fullName: profile?.full_name || 'Utilisateur',
          role: ur.role,
          completedSteps: userProgress.length,
          totalSteps: TRAINING_STEPS.length,
          isCertified: !!certification,
          certifiedAt: certification?.certified_at,
          lastActivity: lastProgress?.completed_at,
        };
      });

      // Sort: uncertified first, then by progress
      staffList.sort((a, b) => {
        if (a.isCertified !== b.isCertified) return a.isCertified ? 1 : -1;
        return b.completedSteps - a.completedSteps;
      });

      setStaffMembers(staffList);
    } catch (error) {
      console.error('Error fetching staff training:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffTraining();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('training-monitor')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_certifications' },
        () => fetchStaffTraining()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStaffTraining]);

  const certifiedCount = staffMembers.filter(s => s.isCertified).length;
  const inProgressCount = staffMembers.filter(s => !s.isCertified && s.completedSteps > 0).length;
  const notStartedCount = staffMembers.filter(s => s.completedSteps === 0).length;
  const certificationRate = staffMembers.length > 0 
    ? Math.round((certifiedCount / staffMembers.length) * 100) 
    : 0;

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ceo: 'CEO',
      superviseur: 'Superviseur',
      agent_administratif: 'Agent Admin',
      directeur_operations: 'Dir. Opérations',
      responsable_technique: 'Resp. Technique',
      centraliste: 'Centraliste',
      accounting: 'Comptabilité',
      commercial: 'Commercial',
      operator: 'Opérateur',
      auditeur: 'Auditeur',
    };
    return labels[role] || role;
  };

  return (
    <Card className="glass-panel border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">TBOS Academy</CardTitle>
              <p className="text-xs text-muted-foreground">Suivi Formation Personnel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchStaffTraining}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Certifiés</span>
            </div>
            <p className="text-2xl font-bold text-success">{certifiedCount}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-xs text-muted-foreground">En cours</span>
            </div>
            <p className="text-2xl font-bold text-warning">{inProgressCount}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Non démarré</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{notStartedCount}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Taux</span>
            </div>
            <p className="text-2xl font-bold text-primary">{certificationRate}%</p>
          </div>
        </div>

        {/* Staff List */}
        <ScrollArea className="h-[300px] rounded-lg border border-border/50">
          <div className="p-2 space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            ) : staffMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Users className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Aucun personnel trouvé</p>
              </div>
            ) : (
              staffMembers.map((staff, idx) => (
                <motion.div
                  key={staff.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    staff.isCertified 
                      ? "bg-success/5 border-success/20" 
                      : staff.completedSteps > 0 
                        ? "bg-warning/5 border-warning/20"
                        : "bg-muted/30 border-border/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold",
                        staff.isCertified ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {staff.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{staff.fullName}</span>
                          {staff.isCertified && (
                            <Badge className="bg-success/20 text-success border-success/30 text-[10px] px-1.5 py-0">
                              <Award className="h-2.5 w-2.5 mr-0.5" />
                              Certifié
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {getRoleLabel(staff.role)}
                          </Badge>
                          <span>{staff.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {staff.isCertified ? (
                        <div className="flex items-center gap-1 text-xs text-success">
                          <Award className="h-3 w-3" />
                          <span>
                            {staff.certifiedAt && format(new Date(staff.certifiedAt), 'dd MMM', { locale: fr })}
                          </span>
                        </div>
                      ) : (
                        <div className="w-24">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progression</span>
                            <span className="font-medium">
                              {staff.completedSteps}/{staff.totalSteps}
                            </span>
                          </div>
                          <Progress 
                            value={(staff.completedSteps / staff.totalSteps) * 100} 
                            className="h-1.5"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
