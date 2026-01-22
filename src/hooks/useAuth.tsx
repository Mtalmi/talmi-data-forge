import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'ceo' | 'operator' | 'accounting' | 'commercial' | 'superviseur' | 'responsable_technique' | 'directeur_operations' | 'agent_administratif' | 'centraliste';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isCeo: boolean;
  isOperator: boolean;
  isAccounting: boolean;
  isCommercial: boolean;
  isSuperviseur: boolean;
  isResponsableTechnique: boolean;
  isDirecteurOperations: boolean;
  isAgentAdministratif: boolean;
  isCentraliste: boolean;
  canCreateBons: boolean;
  canReadPrix: boolean;
  canManageClients: boolean;
  canValidateTechnique: boolean;
  canEditClients: boolean;
  canEditFormules: boolean;
  // Planning permissions
  canEditPlanning: boolean;
  canOverrideCreditBlock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Try new v2 table first
      const { data, error } = await supabase
        .from('user_roles_v2')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching role from v2:', error);
        // Fallback to old table
        const { data: oldData, error: oldError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!oldError && oldData) {
          setRole(oldData.role as AppRole);
        }
        return;
      }

      setRole(data?.role as AppRole ?? null);
    } catch (error) {
      console.error('Error fetching role:', error);
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
  };

  const isCeo = role === 'ceo';
  const isOperator = role === 'operator';
  const isAccounting = role === 'accounting';
  const isCommercial = role === 'commercial';
  const isSuperviseur = role === 'superviseur';
  const isResponsableTechnique = role === 'responsable_technique';
  const isDirecteurOperations = role === 'directeur_operations';
  const isAgentAdministratif = role === 'agent_administratif';
  const isCentraliste = role === 'centraliste';

  const value: AuthContextType = {
    user,
    session,
    role,
    loading,
    signIn,
    signUp,
    signOut,
    isCeo,
    isOperator,
    isAccounting,
    isCommercial,
    isSuperviseur,
    isResponsableTechnique,
    isDirecteurOperations,
    isAgentAdministratif,
    isCentraliste,
    // Derived permissions - CEO ONLY for BL creation
    canCreateBons: isCeo,
    canReadPrix: isCeo,
    canManageClients: isCeo || isAgentAdministratif || isCommercial,
    // Directeur Opérations gets read-only on Clients and Formules
    canEditClients: isCeo || isAgentAdministratif || isCommercial,
    canEditFormules: isCeo,
    canValidateTechnique: isCeo || isResponsableTechnique,
    // Planning permissions - Agent Admin is PRIMARY OWNER, Directeur Ops is READ-ONLY
    canEditPlanning: isCeo || isSuperviseur || isAgentAdministratif,
    // Only Agent Admin and CEO can override credit blocks
    canOverrideCreditBlock: isCeo || isAgentAdministratif,
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
