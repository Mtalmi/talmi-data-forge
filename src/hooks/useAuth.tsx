import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions[]>([]);
  const [loading, setLoading] = useState(true);

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
        
        // Fetch role permissions
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('role_permissions' as any)
          .select('*')
          .eq('role', (profileData as any).role);

        if (!permissionsError && permissionsData) {
          setPermissions(permissionsData as any as RolePermissions[]);
        }
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

  // New role booleans
  const isCeo = role === 'ceo';
  const isSupervisor = role === 'supervisor';
  const isRespTechnique = role === 'resp_technique';
  const isFrontDesk = role === 'frontdesk';
  const isDirecteurOperationnel = role === 'directeur_operationnel';
  const isCentraliste = role === 'centraliste';

  // Legacy role booleans for backward compatibility
  const isOperator = role === 'operator';
  const isAccounting = role === 'accounting';
  const isCommercial = role === 'commercial';
  const isSuperviseur = role === 'superviseur' || isSupervisor;
  const isResponsableTechnique = role === 'responsable_technique' || isRespTechnique;
  const isDirecteurOperations = role === 'directeur_operations' || isDirecteurOperationnel;
  const isAgentAdministratif = role === 'agent_administratif' || isFrontDesk;
  const isAuditeur = role === 'auditeur';

  // ===================================================================
  // MATRICE DES PERMISSIONS - Granular Role-Based Access Control
  // ===================================================================
  
  // Prix d'Achat: CEO & Supervisor ONLY
  const canReadPrix = isCeo || isSupervisor;
  
  // Formules: CEO & Supervisor can edit; Others read-only
  const canEditFormules = isCeo || isSupervisor;
  
  // Clients: CEO/Supervisor/FrontDesk can manage
  const canManageClients = isCeo || isSupervisor || isFrontDesk;
  const canEditClients = isCeo || isSupervisor || isFrontDesk;
  
  // Bons Creation: CEO/Supervisor/FrontDesk
  const canCreateBons = isCeo || isSupervisor || isFrontDesk;
  
  // Validation Technique: CEO/Supervisor/Resp Technique
  const canValidateTechnique = isCeo || isSupervisor || isRespTechnique;
  
  // Consumption Updates: CEO/Supervisor/Centraliste
  const canUpdateConsumption = isCeo || isSupervisor || isCentraliste;
  
  // Truck Assignment: CEO/Supervisor/Dir Ops/FrontDesk
  const canAssignTrucks = isCeo || isSupervisor || isDirecteurOperationnel || isFrontDesk;
  
  // Invoice Generation: CEO/Supervisor/FrontDesk
  const canGenerateInvoice = isCeo || isSupervisor || isFrontDesk;
  
  // Planning Edit: CEO/Supervisor/Dir Ops/FrontDesk
  const canEditPlanning = isCeo || isSupervisor || isDirecteurOperationnel || isFrontDesk;
  
  // Credit Block Override: CEO/Supervisor/FrontDesk
  const canOverrideCreditBlock = isCeo || isSupervisor || isFrontDesk;
  
  // Derogations: CEO/Supervisor can approve; Dir Ops can only request
  const canApproveDerogations = isCeo || isSupervisor;
  const canRequestDerogations = isCeo || isSupervisor || isDirecteurOperationnel || isFrontDesk;
  
  // DEVIS APPROVAL: Only CEO, Supervisor, or FrontDesk
  const canApproveDevis = isCeo || isSupervisor || isFrontDesk;
  
  // Audit Portal: CEO ONLY
  const canAccessAuditPortal = isCeo;
  
  // ===================================================================
  // STOCK MANAGEMENT PERMISSIONS - SEPARATION OF POWERS
  // ===================================================================
  
  // Stock Reception: CEO/Supervisor/Resp Technique (for quality approval)
  const canAddStockReception = isCeo || isSupervisor || isRespTechnique;
  
  // Manual Stock Adjustment: CEO/Supervisor ONLY
  const canAdjustStockManually = isCeo || isSupervisor;
  
  // View Stock Module: Everyone EXCEPT Centraliste
  const canViewStockModule = !isCentraliste;

  // ===================================================================
  // BC WORKFLOW PERMISSIONS - DUAL-PATH CREATION
  // ===================================================================
  
  // Direct BC Creation: CEO/Supervisor/FrontDesk (standard path)
  const canCreateBcDirect = isCeo || isSupervisor || isFrontDesk;
  
  // BC Price Validation: CEO/Supervisor/FrontDesk
  const canValidateBcPrice = isCeo || isSupervisor || isFrontDesk;
  
  // Emergency Window Check: 18:00 - 00:00 (Midnight Emergency Protocol)
  const currentHour = new Date().getHours();
  const isInEmergencyWindow = currentHour >= 18 || currentHour < 0;
  
  // Emergency Bypass: Dir Ops can use emergency bypass ONLY during 18:00-00:00
  // Requires CEO approval
  const canUseEmergencyBypass = (isCeo || isSupervisor || isDirecteurOperationnel) && isInEmergencyWindow;
  
  // Emergency BC View: Resp. Technique needs to see emergency BCs for quality checks
  const canViewEmergencyBcs = isCeo || isSupervisor || isRespTechnique || isDirecteurOperationnel || isFrontDesk;

  const value: AuthContextType = {
    user,
    session,
    role,
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
