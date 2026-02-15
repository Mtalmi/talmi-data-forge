import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useDemoMode, DEMO_USER, DEMO_ROLE } from '@/hooks/useDemoMode';

// Updated role types to match new system
type AppRole = 
  | 'ceo' 
  | 'supervisor' 
  | 'resp_technique' 
  | 'frontdesk' 
  | 'directeur_operationnel' 
  | 'centraliste'
  // Legacy roles for backward compatibility
  | 'operator' 
  | 'accounting' 
  | 'commercial' 
  | 'superviseur' 
  | 'responsable_technique' 
  | 'directeur_operations' 
  | 'agent_administratif' 
  | 'auditeur';

interface RolePermissions {
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  special_constraints: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  permissions: RolePermissions[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  logCriticalAction: (actionType: string, module: string, recordId: string, description: string, notifyCeo?: boolean) => Promise<void>;
  hasPermission: (module: string, permissionType: 'view' | 'create' | 'edit' | 'delete' | 'approve') => boolean;
  
  // Role booleans (updated)
  isCeo: boolean;
  isSupervisor: boolean;
  isRespTechnique: boolean;
  isFrontDesk: boolean;
  isDirecteurOperationnel: boolean;
  isCentraliste: boolean;
  
  // Legacy role booleans for backward compatibility
  isOperator: boolean;
  isAccounting: boolean;
  isCommercial: boolean;
  isSuperviseur: boolean;
  isResponsableTechnique: boolean;
  isDirecteurOperations: boolean;
  isAgentAdministratif: boolean;
  isAuditeur: boolean;
  
  // Granular permissions - MATRICE DES PERMISSIONS
  canCreateBons: boolean;
  canReadPrix: boolean;
  canManageClients: boolean;
  canEditClients: boolean;
  canEditFormules: boolean;
  canValidateTechnique: boolean;
  canEditPlanning: boolean;
  canOverrideCreditBlock: boolean;
  canUpdateConsumption: boolean;
  canAssignTrucks: boolean;
  canGenerateInvoice: boolean;
  canApproveDerogations: boolean;
  canRequestDerogations: boolean;
  canApproveDevis: boolean;
  canAccessAuditPortal: boolean;
  canAddStockReception: boolean;
  canAdjustStockManually: boolean;
  canViewStockModule: boolean;
  canCreateBcDirect: boolean;
  canValidateBcPrice: boolean;
  canUseEmergencyBypass: boolean;
  canViewEmergencyBcs: boolean;
  isInEmergencyWindow: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isDemoMode } = useDemoMode();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions[]>([]);
  const [loading, setLoading] = useState(true);

  // Demo mode overrides
  const effectiveUser = isDemoMode ? DEMO_USER : user;
  const effectiveRole = isDemoMode ? DEMO_ROLE : role;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoleAndPermissions(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setPermissions([]);
        }
      }
    );

      if (isDemoMode) {
        setLoading(false);
        return () => subscription.unsubscribe();
      }
      supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRoleAndPermissions(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoleAndPermissions = async (userId: string) => {
    try {
      // Fetch user profile with role
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles' as any)
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Fallback to legacy tables
        await fetchLegacyRole(userId);
        return;
      }

      if (profileData) {
        setRole((profileData as any).role as AppRole);
        
        // Role permissions are enforced via role-based logic throughout the app
        // No separate role_permissions table needed
      }
    } catch (error) {
      console.error('Error fetching role and permissions:', error);
    }
  };

  const fetchLegacyRole = async (userId: string) => {
    try {
      // Try new v2 table first
      const { data, error } = await supabase
        .from('user_roles_v2' as any)
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching role from v2:', error);
        // Fallback to old table
        const { data: oldData, error: oldError } = await supabase
          .from('user_roles' as any)
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!oldError && oldData) {
          setRole((oldData as any).role as AppRole);
        }
        return;
      }

      setRole((data as any)?.role as AppRole ?? null);
    } catch (error) {
      console.error('Error fetching legacy role:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setPermissions([]);
  };

  // Log critical actions
  const logCriticalAction = async (
    actionType: string,
    module: string,
    recordId: string,
    description: string,
    notifyCeo: boolean = false
  ) => {
    try {
      await supabase.rpc('log_critical_action' as any, {
        action_type_val: actionType,
        module_val: module,
        record_id_val: recordId,
        description_val: description,
        notify_ceo: notifyCeo
      });
    } catch (error) {
      console.error('Error logging critical action:', error);
    }
  };

  // Check if user has specific permission
  const hasPermission = (module: string, permissionType: 'view' | 'create' | 'edit' | 'delete' | 'approve'): boolean => {
    const perm = permissions.find(p => p.module === module);
    if (!perm) return false;

    switch (permissionType) {
      case 'view': return perm.can_view;
      case 'create': return perm.can_create;
      case 'edit': return perm.can_edit;
      case 'delete': return perm.can_delete;
      case 'approve': return perm.can_approve;
      default: return false;
    }
  };

  // New role booleans (use effectiveRole for demo support)
  const isCeo = effectiveRole === 'ceo';
  const isSupervisor = effectiveRole === 'supervisor';
  const isRespTechnique = effectiveRole === 'resp_technique';
  const isFrontDesk = effectiveRole === 'frontdesk';
  const isDirecteurOperationnel = effectiveRole === 'directeur_operationnel';
  const isCentraliste = effectiveRole === 'centraliste';

  // Legacy role booleans for backward compatibility
  const isOperator = effectiveRole === 'operator';
  const isAccounting = effectiveRole === 'accounting';
  const isCommercial = effectiveRole === 'commercial';
  const isSuperviseur = effectiveRole === 'superviseur' || isSupervisor;
  const isResponsableTechnique = effectiveRole === 'responsable_technique' || isRespTechnique;
  const isDirecteurOperations = effectiveRole === 'directeur_operations' || isDirecteurOperationnel;
  const isAgentAdministratif = effectiveRole === 'agent_administratif' || isFrontDesk;
  const isAuditeur = effectiveRole === 'auditeur';

  // ===================================================================
  // MATRICE DES PERMISSIONS - Granular Role-Based Access Control
  // Uses legacy booleans (which include OR fallback for both new + legacy role strings)
  // ===================================================================
  
  // Prix d'Achat: CEO & Supervisor ONLY
  const canReadPrix = isCeo || isSuperviseur;
  
  // Formules: CEO & Supervisor can edit; Others read-only
  const canEditFormules = isCeo || isSuperviseur;
  
  // Clients: CEO/Supervisor/FrontDesk can manage
  const canManageClients = isCeo || isSuperviseur || isAgentAdministratif;
  const canEditClients = isCeo || isSuperviseur || isAgentAdministratif;
  
  // Bons Creation: CEO/Supervisor/FrontDesk
  const canCreateBons = isCeo || isSuperviseur || isAgentAdministratif;
  
  // Validation Technique: CEO/Supervisor/Resp Technique
  const canValidateTechnique = isCeo || isSuperviseur || isResponsableTechnique;
  
  // Consumption Updates: CEO/Supervisor/Centraliste
  const canUpdateConsumption = isCeo || isSuperviseur || isCentraliste;
  
  // Truck Assignment: CEO/Supervisor/Dir Ops/FrontDesk
  const canAssignTrucks = isCeo || isSuperviseur || isDirecteurOperations || isAgentAdministratif;
  
  // Invoice Generation: CEO/Supervisor/FrontDesk
  const canGenerateInvoice = isCeo || isSuperviseur || isAgentAdministratif;
  
  // Planning Edit: CEO/Supervisor/Dir Ops/FrontDesk
  const canEditPlanning = isCeo || isSuperviseur || isDirecteurOperations || isAgentAdministratif;
  
  // Credit Block Override: CEO/Supervisor/FrontDesk
  const canOverrideCreditBlock = isCeo || isSuperviseur || isAgentAdministratif;
  
  // Derogations: CEO/Supervisor can approve; Dir Ops can only request
  const canApproveDerogations = isCeo || isSuperviseur;
  const canRequestDerogations = isCeo || isSuperviseur || isDirecteurOperations || isAgentAdministratif;
  
  // DEVIS APPROVAL: Only CEO, Supervisor, or FrontDesk
  const canApproveDevis = isCeo || isSuperviseur || isAgentAdministratif;
  
  // Audit Portal: CEO & Supervisor
  const canAccessAuditPortal = isCeo || isSuperviseur;
  
  // ===================================================================
  // STOCK MANAGEMENT PERMISSIONS - SEPARATION OF POWERS
  // ===================================================================
  
  // Stock Reception: CEO/Supervisor/Resp Technique (for quality approval)
  const canAddStockReception = isCeo || isSuperviseur || isResponsableTechnique;
  
  // Manual Stock Adjustment: CEO/Supervisor ONLY
  const canAdjustStockManually = isCeo || isSuperviseur;
  
  // View Stock Module: Everyone EXCEPT Centraliste
  const canViewStockModule = !isCentraliste;

  // ===================================================================
  // BC WORKFLOW PERMISSIONS - DUAL-PATH CREATION
  // ===================================================================
  
  // Direct BC Creation: CEO/Supervisor/FrontDesk (standard path)
  const canCreateBcDirect = isCeo || isSuperviseur || isAgentAdministratif;
  
  // BC Price Validation: CEO/Supervisor/FrontDesk
  const canValidateBcPrice = isCeo || isSuperviseur || isAgentAdministratif;
  
  // Emergency Window Check: 18:00 - 00:00 (Midnight Emergency Protocol)
  const currentHour = new Date().getHours();
  const isInEmergencyWindow = currentHour >= 18 || currentHour < 0;
  
  // Emergency Bypass: Dir Ops can use emergency bypass ONLY during 18:00-00:00
  // Requires CEO approval
  const canUseEmergencyBypass = (isCeo || isSuperviseur || isDirecteurOperations) && isInEmergencyWindow;
  
  // Emergency BC View: Resp. Technique needs to see emergency BCs for quality checks
  const canViewEmergencyBcs = isCeo || isSuperviseur || isResponsableTechnique || isDirecteurOperations || isAgentAdministratif;

  const value: AuthContextType = {
    user: effectiveUser,
    session: isDemoMode ? ({} as Session) : session,
    role: effectiveRole,
    permissions,
    loading,
    signIn,
    signUp,
    signOut,
    logCriticalAction,
    hasPermission,
    // New roles
    isCeo,
    isSupervisor,
    isRespTechnique,
    isFrontDesk,
    isDirecteurOperationnel,
    isCentraliste,
    // Legacy roles
    isOperator,
    isAccounting,
    isCommercial,
    isSuperviseur,
    isResponsableTechnique,
    isDirecteurOperations,
    isAgentAdministratif,
    isAuditeur,
    // Permissions
    canCreateBons,
    canReadPrix,
    canManageClients,
    canEditClients,
    canEditFormules,
    canValidateTechnique,
    canEditPlanning,
    canOverrideCreditBlock,
    canUpdateConsumption,
    canAssignTrucks,
    canGenerateInvoice,
    canApproveDerogations,
    canRequestDerogations,
    canAccessAuditPortal,
    canApproveDevis,
    // Stock management
    canAddStockReception,
    canAdjustStockManually,
    canViewStockModule,
    // BC Workflow
    canCreateBcDirect,
    canValidateBcPrice,
    canUseEmergencyBypass,
    canViewEmergencyBcs,
    isInEmergencyWindow,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
