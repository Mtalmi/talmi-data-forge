export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bons_livraison_reels: {
        Row: {
          adjuvant_reel_l: number | null
          alerte_ecart: boolean | null
          bl_id: string
          ciment_reel_kg: number
          client_id: string
          created_at: string
          created_by: string | null
          cur_reel: number | null
          date_livraison: string
          eau_reel_l: number | null
          ecart_marge: number | null
          formule_id: string
          km_parcourus: number | null
          statut_paiement: string
          temps_mission_heures: number | null
          updated_at: string
          volume_m3: number
        }
        Insert: {
          adjuvant_reel_l?: number | null
          alerte_ecart?: boolean | null
          bl_id: string
          ciment_reel_kg: number
          client_id: string
          created_at?: string
          created_by?: string | null
          cur_reel?: number | null
          date_livraison?: string
          eau_reel_l?: number | null
          ecart_marge?: number | null
          formule_id: string
          km_parcourus?: number | null
          statut_paiement?: string
          temps_mission_heures?: number | null
          updated_at?: string
          volume_m3: number
        }
        Update: {
          adjuvant_reel_l?: number | null
          alerte_ecart?: boolean | null
          bl_id?: string
          ciment_reel_kg?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          cur_reel?: number | null
          date_livraison?: string
          eau_reel_l?: number | null
          ecart_marge?: number | null
          formule_id?: string
          km_parcourus?: number | null
          statut_paiement?: string
          temps_mission_heures?: number | null
          updated_at?: string
          volume_m3?: number
        }
        Relationships: [
          {
            foreignKeyName: "bons_livraison_reels_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "bons_livraison_reels_formule_id_fkey"
            columns: ["formule_id"]
            isOneToOne: false
            referencedRelation: "formules_theoriques"
            referencedColumns: ["formule_id"]
          },
        ]
      }
      clients: {
        Row: {
          adresse: string | null
          client_id: string
          contact_personne: string | null
          created_at: string
          delai_paiement_jours: number | null
          email: string | null
          nom_client: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          client_id: string
          contact_personne?: string | null
          created_at?: string
          delai_paiement_jours?: number | null
          email?: string | null
          nom_client: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          client_id?: string
          contact_personne?: string | null
          created_at?: string
          delai_paiement_jours?: number | null
          email?: string | null
          nom_client?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      formules_theoriques: {
        Row: {
          adjuvant_l_m3: number
          ciment_kg_m3: number
          created_at: string
          designation: string
          eau_l_m3: number
          formule_id: string
          gravier_kg_m3: number | null
          sable_kg_m3: number | null
          updated_at: string
        }
        Insert: {
          adjuvant_l_m3?: number
          ciment_kg_m3: number
          created_at?: string
          designation: string
          eau_l_m3: number
          formule_id: string
          gravier_kg_m3?: number | null
          sable_kg_m3?: number | null
          updated_at?: string
        }
        Update: {
          adjuvant_l_m3?: number
          ciment_kg_m3?: number
          created_at?: string
          designation?: string
          eau_l_m3?: number
          formule_id?: string
          gravier_kg_m3?: number | null
          sable_kg_m3?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      prix_achat_actuels: {
        Row: {
          created_at: string
          date_mise_a_jour: string
          matiere_premiere: string
          prix_precedent: number | null
          prix_unitaire_dh: number
          unite_mesure: string
        }
        Insert: {
          created_at?: string
          date_mise_a_jour?: string
          matiere_premiere: string
          prix_precedent?: number | null
          prix_unitaire_dh: number
          unite_mesure: string
        }
        Update: {
          created_at?: string
          date_mise_a_jour?: string
          matiere_premiere?: string
          prix_precedent?: number | null
          prix_unitaire_dh?: number
          unite_mesure?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles_v2: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_modify_bon_within_time: {
        Args: { _created_at: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_v2: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      is_accounting: { Args: { _user_id: string }; Returns: boolean }
      is_agent_administratif: { Args: { _user_id: string }; Returns: boolean }
      is_centraliste: { Args: { _user_id: string }; Returns: boolean }
      is_ceo: { Args: { _user_id: string }; Returns: boolean }
      is_ceo_v2: { Args: { _user_id: string }; Returns: boolean }
      is_commercial: { Args: { _user_id: string }; Returns: boolean }
      is_directeur_operations: { Args: { _user_id: string }; Returns: boolean }
      is_operator: { Args: { _user_id: string }; Returns: boolean }
      is_responsable_technique: { Args: { _user_id: string }; Returns: boolean }
      is_superviseur: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "ceo" | "operator" | "accounting" | "commercial"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ceo", "operator", "accounting", "commercial"],
    },
  },
} as const
