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
      achats: {
        Row: {
          created_at: string
          created_by: string | null
          date_commande: string
          date_livraison_prevue: string | null
          date_livraison_reelle: string | null
          fournisseur_id: string
          id: string
          montant_ht: number
          montant_ttc: number | null
          notes: string | null
          numero_achat: string
          statut: string
          tva_pct: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_commande?: string
          date_livraison_prevue?: string | null
          date_livraison_reelle?: string | null
          fournisseur_id: string
          id?: string
          montant_ht?: number
          montant_ttc?: number | null
          notes?: string | null
          numero_achat: string
          statut?: string
          tva_pct?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_commande?: string
          date_livraison_prevue?: string | null
          date_livraison_reelle?: string | null
          fournisseur_id?: string
          id?: string
          montant_ht?: number
          montant_ttc?: number | null
          notes?: string | null
          numero_achat?: string
          statut?: string
          tva_pct?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "achats_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "contract_compliance_summary"
            referencedColumns: ["fournisseur_id"]
          },
          {
            foreignKeyName: "achats_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      alertes_reapprovisionnement: {
        Row: {
          actif: boolean | null
          created_at: string
          delai_commande_jours: number | null
          derniere_alerte: string | null
          fournisseur_prefere_id: string | null
          id: string
          materiau: string
          quantite_reorder: number
          seuil_alerte: number
          updated_at: string
        }
        Insert: {
          actif?: boolean | null
          created_at?: string
          delai_commande_jours?: number | null
          derniere_alerte?: string | null
          fournisseur_prefere_id?: string | null
          id?: string
          materiau: string
          quantite_reorder: number
          seuil_alerte: number
          updated_at?: string
        }
        Update: {
          actif?: boolean | null
          created_at?: string
          delai_commande_jours?: number | null
          derniere_alerte?: string | null
          fournisseur_prefere_id?: string | null
          id?: string
          materiau?: string
          quantite_reorder?: number
          seuil_alerte?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertes_reapprovisionnement_fournisseur_prefere_id_fkey"
            columns: ["fournisseur_prefere_id"]
            isOneToOne: false
            referencedRelation: "contract_compliance_summary"
            referencedColumns: ["fournisseur_id"]
          },
          {
            foreignKeyName: "alertes_reapprovisionnement_fournisseur_prefere_id_fkey"
            columns: ["fournisseur_prefere_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      alertes_systeme: {
        Row: {
          created_at: string | null
          destinataire_role: string | null
          dismissible: boolean | null
          escalated_at: string | null
          escalation_history: Json | null
          escalation_level: number | null
          id: string
          lu: boolean | null
          lu_at: string | null
          lu_par: string | null
          message: string
          niveau: string
          original_destinataire_role: string | null
          reference_id: string | null
          reference_table: string | null
          titre: string
          type_alerte: string
        }
        Insert: {
          created_at?: string | null
          destinataire_role?: string | null
          dismissible?: boolean | null
          escalated_at?: string | null
          escalation_history?: Json | null
          escalation_level?: number | null
          id?: string
          lu?: boolean | null
          lu_at?: string | null
          lu_par?: string | null
          message: string
          niveau: string
          original_destinataire_role?: string | null
          reference_id?: string | null
          reference_table?: string | null
          titre: string
          type_alerte: string
        }
        Update: {
          created_at?: string | null
          destinataire_role?: string | null
          dismissible?: boolean | null
          escalated_at?: string | null
          escalation_history?: Json | null
          escalation_level?: number | null
          id?: string
          lu?: boolean | null
          lu_at?: string | null
          lu_par?: string | null
          message?: string
          niveau?: string
          original_destinataire_role?: string | null
          reference_id?: string | null
          reference_table?: string | null
          titre?: string
          type_alerte?: string
        }
        Relationships: []
      }
      approbations_ceo: {
        Row: {
          approuve_at: string | null
          approuve_par: string | null
          commentaire: string | null
          demande_at: string | null
          demande_par: string
          details: Json | null
          id: string
          montant: number | null
          reference_id: string
          reference_table: string
          statut: string
          type_approbation: string
        }
        Insert: {
          approuve_at?: string | null
          approuve_par?: string | null
          commentaire?: string | null
          demande_at?: string | null
          demande_par: string
          details?: Json | null
          id?: string
          montant?: number | null
          reference_id: string
          reference_table: string
          statut?: string
          type_approbation: string
        }
        Update: {
          approuve_at?: string | null
          approuve_par?: string | null
          commentaire?: string | null
          demande_at?: string | null
          demande_par?: string
          details?: Json | null
          id?: string
          montant?: number | null
          reference_id?: string
          reference_table?: string
          statut?: string
          type_approbation?: string
        }
        Relationships: []
      }
      approval_audit_log: {
        Row: {
          action: string
          created_at: string
          event_id: string
          event_type: string
          id: string
          ip_address: string | null
          new_status: string | null
          previous_status: string | null
          quote_id: string
          reason: string | null
          security_flag: boolean | null
          session_id: string | null
          timestamp: string
          user_id: string | null
          user_name: string | null
          user_role: string | null
          validation_details: Json | null
        }
        Insert: {
          action: string
          created_at?: string
          event_id?: string
          event_type: string
          id?: string
          ip_address?: string | null
          new_status?: string | null
          previous_status?: string | null
          quote_id: string
          reason?: string | null
          security_flag?: boolean | null
          session_id?: string | null
          timestamp?: string
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
          validation_details?: Json | null
        }
        Update: {
          action?: string
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          new_status?: string | null
          previous_status?: string | null
          quote_id?: string
          reason?: string | null
          security_flag?: boolean | null
          session_id?: string | null
          timestamp?: string
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
          validation_details?: Json | null
        }
        Relationships: []
      }
      ar_ap_reconciliation: {
        Row: {
          adjustments: number | null
          closing_balance: number
          created_at: string
          dso_dpo_days: number | null
          id: string
          invoices_issued: number | null
          on_time_rate: number | null
          opening_balance: number
          payments_received: number | null
          period_month: string
          reconciled_at: string | null
          reconciled_by: string | null
          status: string | null
          type: string
          variance: number | null
          variance_explanation: string | null
          write_offs: number | null
        }
        Insert: {
          adjustments?: number | null
          closing_balance: number
          created_at?: string
          dso_dpo_days?: number | null
          id?: string
          invoices_issued?: number | null
          on_time_rate?: number | null
          opening_balance: number
          payments_received?: number | null
          period_month: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          status?: string | null
          type: string
          variance?: number | null
          variance_explanation?: string | null
          write_offs?: number | null
        }
        Update: {
          adjustments?: number | null
          closing_balance?: number
          created_at?: string
          dso_dpo_days?: number | null
          id?: string
          invoices_issued?: number | null
          on_time_rate?: number | null
          opening_balance?: number
          payments_received?: number | null
          period_month?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          status?: string | null
          type?: string
          variance?: number | null
          variance_explanation?: string | null
          write_offs?: number | null
        }
        Relationships: []
      }
      asset_depreciation_schedule: {
        Row: {
          accumulated_depreciation: number
          asset_id: string
          created_at: string
          depreciation_amount: number
          id: string
          is_posted: boolean | null
          net_book_value: number
          period_date: string
          period_number: number
          posted_at: string | null
          posted_by: string | null
        }
        Insert: {
          accumulated_depreciation: number
          asset_id: string
          created_at?: string
          depreciation_amount: number
          id?: string
          is_posted?: boolean | null
          net_book_value: number
          period_date: string
          period_number: number
          posted_at?: string | null
          posted_by?: string | null
        }
        Update: {
          accumulated_depreciation?: number
          asset_id?: string
          created_at?: string
          depreciation_amount?: number
          id?: string
          is_posted?: boolean | null
          net_book_value?: number
          period_date?: string
          period_number?: number
          posted_at?: string | null
          posted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_depreciation_schedule_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_disposals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          asset_id: string
          buyer_contact: string | null
          buyer_name: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          disposal_date: string
          disposal_price: number | null
          disposal_reason: string | null
          disposal_type: string
          documents: Json | null
          gain_loss: number
          id: string
          invoice_url: string | null
          net_book_value_at_disposal: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          asset_id: string
          buyer_contact?: string | null
          buyer_name?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          disposal_date: string
          disposal_price?: number | null
          disposal_reason?: string | null
          disposal_type: string
          documents?: Json | null
          gain_loss: number
          id?: string
          invoice_url?: string | null
          net_book_value_at_disposal: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          asset_id?: string
          buyer_contact?: string | null
          buyer_name?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          disposal_date?: string
          disposal_price?: number | null
          disposal_reason?: string | null
          disposal_type?: string
          documents?: Json | null
          gain_loss?: number
          id?: string
          invoice_url?: string | null
          net_book_value_at_disposal?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_disposals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_inventory_checks: {
        Row: {
          condition_issues: number
          created_at: string
          created_by: string | null
          created_by_name: string | null
          extra_count: number
          id: string
          inventory_date: string
          inventory_year: number
          location_errors: number
          missing_count: number
          reconciled_at: string | null
          reconciled_by: string | null
          reconciled_by_name: string | null
          reconciliation_notes: string | null
          results: Json
          status: string
          total_assets_found: number
          total_assets_system: number
        }
        Insert: {
          condition_issues?: number
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          extra_count?: number
          id?: string
          inventory_date: string
          inventory_year: number
          location_errors?: number
          missing_count?: number
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciled_by_name?: string | null
          reconciliation_notes?: string | null
          results?: Json
          status?: string
          total_assets_found?: number
          total_assets_system?: number
        }
        Update: {
          condition_issues?: number
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          extra_count?: number
          id?: string
          inventory_date?: string
          inventory_year?: number
          location_errors?: number
          missing_count?: number
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciled_by_name?: string | null
          reconciliation_notes?: string | null
          results?: Json
          status?: string
          total_assets_found?: number
          total_assets_system?: number
        }
        Relationships: []
      }
      asset_maintenance: {
        Row: {
          asset_id: string
          cost: number
          created_at: string
          created_by: string | null
          created_by_name: string | null
          description: string | null
          id: string
          invoice_url: string | null
          maintenance_date: string
          maintenance_type: string
          next_maintenance_date: string | null
          next_maintenance_type: string | null
          performed_by: string | null
          photos: Json | null
        }
        Insert: {
          asset_id: string
          cost?: number
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          id?: string
          invoice_url?: string | null
          maintenance_date: string
          maintenance_type: string
          next_maintenance_date?: string | null
          next_maintenance_type?: string | null
          performed_by?: string | null
          photos?: Json | null
        }
        Update: {
          asset_id?: string
          cost?: number
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          id?: string
          invoice_url?: string | null
          maintenance_date?: string
          maintenance_type?: string
          next_maintenance_date?: string | null
          next_maintenance_type?: string | null
          performed_by?: string | null
          photos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      associate_transactions: {
        Row: {
          amount: number
          approval_level: string | null
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          associate_id: string
          bank_reference: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          description: string
          direction: string
          document_url: string | null
          executed_at: string | null
          executed_by: string | null
          executed_by_name: string | null
          id: string
          justification: string | null
          loan_id: string | null
          loan_payment_id: string | null
          requires_approval: boolean | null
          status: string
          transaction_number: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          approval_level?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          associate_id: string
          bank_reference?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description: string
          direction: string
          document_url?: string | null
          executed_at?: string | null
          executed_by?: string | null
          executed_by_name?: string | null
          id?: string
          justification?: string | null
          loan_id?: string | null
          loan_payment_id?: string | null
          requires_approval?: boolean | null
          status?: string
          transaction_number: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approval_level?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          associate_id?: string
          bank_reference?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string
          direction?: string
          document_url?: string | null
          executed_at?: string | null
          executed_by?: string | null
          executed_by_name?: string | null
          id?: string
          justification?: string | null
          loan_id?: string | null
          loan_payment_id?: string | null
          requires_approval?: boolean | null
          status?: string
          transaction_number?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "associate_transactions_associate_id_fkey"
            columns: ["associate_id"]
            isOneToOne: false
            referencedRelation: "associates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associate_transactions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associate_transactions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associate_transactions_loan_payment_id_fkey"
            columns: ["loan_payment_id"]
            isOneToOne: false
            referencedRelation: "loan_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      associates: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          relationship: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          relationship: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          relationship?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      audit_superviseur: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          id: string
          new_data: Json | null
          notified: boolean | null
          notified_at: string | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          id?: string
          new_data?: Json | null
          notified?: boolean | null
          notified_at?: string | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          id?: string
          new_data?: Json | null
          notified?: boolean | null
          notified_at?: string | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      audits_externes: {
        Row: {
          audit_period: string
          auditor_id: string
          auditor_notes: string | null
          cash_app_amount: number
          cash_comment: string | null
          cash_physical_amount: number
          cash_variance: number | null
          cash_variance_pct: number | null
          compliance_score: number | null
          created_at: string
          document_checks: Json
          documents_missing_count: number | null
          documents_verified_count: number | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          is_locked: boolean
          locked_at: string | null
          locked_by: string | null
          silo_checks: Json
          silo_variance_max_pct: number | null
          status: string
          submitted_at: string | null
          truck_anomaly_detected: boolean | null
          truck_checks: Json
          updated_at: string
        }
        Insert: {
          audit_period: string
          auditor_id: string
          auditor_notes?: string | null
          cash_app_amount?: number
          cash_comment?: string | null
          cash_physical_amount?: number
          cash_variance?: number | null
          cash_variance_pct?: number | null
          compliance_score?: number | null
          created_at?: string
          document_checks?: Json
          documents_missing_count?: number | null
          documents_verified_count?: number | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          silo_checks?: Json
          silo_variance_max_pct?: number | null
          status?: string
          submitted_at?: string | null
          truck_anomaly_detected?: boolean | null
          truck_checks?: Json
          updated_at?: string
        }
        Update: {
          audit_period?: string
          auditor_id?: string
          auditor_notes?: string | null
          cash_app_amount?: number
          cash_comment?: string | null
          cash_physical_amount?: number
          cash_variance?: number | null
          cash_variance_pct?: number | null
          compliance_score?: number | null
          created_at?: string
          document_checks?: Json
          documents_missing_count?: number | null
          documents_verified_count?: number | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          silo_checks?: Json
          silo_variance_max_pct?: number | null
          status?: string
          submitted_at?: string | null
          truck_anomaly_detected?: boolean | null
          truck_checks?: Json
          updated_at?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          client_id_suggere: string | null
          created_at: string
          date_transaction: string
          date_valeur: string | null
          devise: string | null
          facture_id_suggeree: string | null
          id: string
          libelle: string
          montant: number
          notes: string | null
          rapproche_at: string | null
          rapproche_par: string | null
          reference_bancaire: string | null
          score_confiance: number | null
          statut_rapprochement: string | null
          type_transaction: string | null
          updated_at: string
        }
        Insert: {
          client_id_suggere?: string | null
          created_at?: string
          date_transaction: string
          date_valeur?: string | null
          devise?: string | null
          facture_id_suggeree?: string | null
          id?: string
          libelle: string
          montant: number
          notes?: string | null
          rapproche_at?: string | null
          rapproche_par?: string | null
          reference_bancaire?: string | null
          score_confiance?: number | null
          statut_rapprochement?: string | null
          type_transaction?: string | null
          updated_at?: string
        }
        Update: {
          client_id_suggere?: string | null
          created_at?: string
          date_transaction?: string
          date_valeur?: string | null
          devise?: string | null
          facture_id_suggeree?: string | null
          id?: string
          libelle?: string
          montant?: number
          notes?: string | null
          rapproche_at?: string | null
          rapproche_par?: string | null
          reference_bancaire?: string | null
          score_confiance?: number | null
          statut_rapprochement?: string | null
          type_transaction?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bons_commande: {
        Row: {
          adresse_livraison: string | null
          bc_id: string
          client_confirmed_at: string | null
          client_confirmed_by_name: string | null
          client_id: string
          client_signature_url: string | null
          conditions_acces: string | null
          contact_chantier: string | null
          created_at: string
          created_by: string | null
          date_livraison_souhaitee: string | null
          devis_id: string | null
          facture_consolidee_id: string | null
          facture_mode: string | null
          formule_id: string
          heure_livraison_souhaitee: string | null
          id: string
          lock_expires_at: string | null
          locked_at: string | null
          locked_by: string | null
          mode_paiement: string | null
          nb_livraisons: number | null
          notes: string | null
          pompe_requise: boolean | null
          prestataire_id: string | null
          prix_livraison_m3: number | null
          prix_vente_m3: number
          prix_verrouille: boolean
          reference_client: string | null
          statut: string
          telephone_chantier: string | null
          total_ht: number
          tracking_enabled: boolean | null
          tracking_token: string | null
          type_pompe: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validated_by_name: string | null
          validated_by_role: string | null
          volume_livre: number | null
          volume_m3: number
          volume_restant: number | null
          zone_livraison_id: string | null
        }
        Insert: {
          adresse_livraison?: string | null
          bc_id: string
          client_confirmed_at?: string | null
          client_confirmed_by_name?: string | null
          client_id: string
          client_signature_url?: string | null
          conditions_acces?: string | null
          contact_chantier?: string | null
          created_at?: string
          created_by?: string | null
          date_livraison_souhaitee?: string | null
          devis_id?: string | null
          facture_consolidee_id?: string | null
          facture_mode?: string | null
          formule_id: string
          heure_livraison_souhaitee?: string | null
          id?: string
          lock_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          mode_paiement?: string | null
          nb_livraisons?: number | null
          notes?: string | null
          pompe_requise?: boolean | null
          prestataire_id?: string | null
          prix_livraison_m3?: number | null
          prix_vente_m3: number
          prix_verrouille?: boolean
          reference_client?: string | null
          statut?: string
          telephone_chantier?: string | null
          total_ht: number
          tracking_enabled?: boolean | null
          tracking_token?: string | null
          type_pompe?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validated_by_name?: string | null
          validated_by_role?: string | null
          volume_livre?: number | null
          volume_m3: number
          volume_restant?: number | null
          zone_livraison_id?: string | null
        }
        Update: {
          adresse_livraison?: string | null
          bc_id?: string
          client_confirmed_at?: string | null
          client_confirmed_by_name?: string | null
          client_id?: string
          client_signature_url?: string | null
          conditions_acces?: string | null
          contact_chantier?: string | null
          created_at?: string
          created_by?: string | null
          date_livraison_souhaitee?: string | null
          devis_id?: string | null
          facture_consolidee_id?: string | null
          facture_mode?: string | null
          formule_id?: string
          heure_livraison_souhaitee?: string | null
          id?: string
          lock_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          mode_paiement?: string | null
          nb_livraisons?: number | null
          notes?: string | null
          pompe_requise?: boolean | null
          prestataire_id?: string | null
          prix_livraison_m3?: number | null
          prix_vente_m3?: number
          prix_verrouille?: boolean
          reference_client?: string | null
          statut?: string
          telephone_chantier?: string | null
          total_ht?: number
          tracking_enabled?: boolean | null
          tracking_token?: string | null
          type_pompe?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validated_by_name?: string | null
          validated_by_role?: string | null
          volume_livre?: number | null
          volume_m3?: number
          volume_restant?: number | null
          zone_livraison_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bons_commande_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "bons_commande_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["devis_id"]
          },
          {
            foreignKeyName: "bons_commande_formule_id_fkey"
            columns: ["formule_id"]
            isOneToOne: false
            referencedRelation: "formules_theoriques"
            referencedColumns: ["formule_id"]
          },
          {
            foreignKeyName: "bons_commande_prestataire_id_fkey"
            columns: ["prestataire_id"]
            isOneToOne: false
            referencedRelation: "prestataires_transport"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bons_commande_zone_livraison_id_fkey"
            columns: ["zone_livraison_id"]
            isOneToOne: false
            referencedRelation: "zones_livraison"
            referencedColumns: ["id"]
          },
        ]
      }
      bons_livraison_reels: {
        Row: {
          adjuvant_reel_l: number | null
          affaissement_conforme: boolean | null
          affaissement_mm: number | null
          alerte_ecart: boolean | null
          alerte_marge: boolean | null
          alerte_planification: boolean | null
          annule_at: string | null
          annule_par: string | null
          assignation_count: number | null
          bc_id: string | null
          bl_id: string
          camion_assigne: string | null
          chauffeur_nom: string | null
          ciment_reel_kg: number
          client_confirmed_at: string | null
          client_confirmed_by_name: string | null
          client_id: string
          client_signature_url: string | null
          consommation_calculee: number | null
          created_at: string
          created_by: string | null
          cur_reel: number | null
          date_livraison: string
          debrief_at: string | null
          debrief_valide: boolean | null
          eau_reel_l: number | null
          ecart_marge: number | null
          facture_generee: boolean | null
          facture_id: string | null
          facturer_attente: boolean | null
          formule_id: string
          gravette_reel_kg: number | null
          heure_arrivee_chantier: string | null
          heure_depart_centrale: string | null
          heure_depart_prevue: string | null
          heure_depart_reelle: string | null
          heure_prevue: string | null
          heure_retour_centrale: string | null
          justification_ecart: string | null
          km_final: number | null
          km_parcourus: number | null
          litres_ajoutes: number | null
          lock_expires_at: string | null
          locked_at: string | null
          locked_by: string | null
          machine_id: string | null
          marge_brute_pct: number | null
          mode_paiement: string | null
          payment_recorded_at: string | null
          payment_recorded_by: string | null
          payment_recorded_by_name: string | null
          photo_pupitre_url: string | null
          prestataire_id: string | null
          prix_livraison_m3: number | null
          prix_vente_m3: number | null
          production_batch_time: string | null
          quality_status: string | null
          raison_annulation: string | null
          sable_reel_kg: number | null
          source_donnees: string | null
          statut_paiement: string
          temps_attente_chantier_minutes: number | null
          temps_attente_reel_minutes: number | null
          temps_attente_site: number | null
          temps_mission_heures: number | null
          temps_rotation_minutes: number | null
          toupie_assignee: string | null
          tracking_token: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validated_by_name: string | null
          validated_by_role: string | null
          validation_technique: boolean | null
          variance_adjuvant_pct: number | null
          variance_ciment_pct: number | null
          variance_eau_pct: number | null
          variance_gravette_pct: number | null
          variance_sable_pct: number | null
          volume_m3: number
          volume_perdu: number | null
          workflow_status: string | null
          zone_livraison_id: string | null
        }
        Insert: {
          adjuvant_reel_l?: number | null
          affaissement_conforme?: boolean | null
          affaissement_mm?: number | null
          alerte_ecart?: boolean | null
          alerte_marge?: boolean | null
          alerte_planification?: boolean | null
          annule_at?: string | null
          annule_par?: string | null
          assignation_count?: number | null
          bc_id?: string | null
          bl_id: string
          camion_assigne?: string | null
          chauffeur_nom?: string | null
          ciment_reel_kg: number
          client_confirmed_at?: string | null
          client_confirmed_by_name?: string | null
          client_id: string
          client_signature_url?: string | null
          consommation_calculee?: number | null
          created_at?: string
          created_by?: string | null
          cur_reel?: number | null
          date_livraison?: string
          debrief_at?: string | null
          debrief_valide?: boolean | null
          eau_reel_l?: number | null
          ecart_marge?: number | null
          facture_generee?: boolean | null
          facture_id?: string | null
          facturer_attente?: boolean | null
          formule_id: string
          gravette_reel_kg?: number | null
          heure_arrivee_chantier?: string | null
          heure_depart_centrale?: string | null
          heure_depart_prevue?: string | null
          heure_depart_reelle?: string | null
          heure_prevue?: string | null
          heure_retour_centrale?: string | null
          justification_ecart?: string | null
          km_final?: number | null
          km_parcourus?: number | null
          litres_ajoutes?: number | null
          lock_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          machine_id?: string | null
          marge_brute_pct?: number | null
          mode_paiement?: string | null
          payment_recorded_at?: string | null
          payment_recorded_by?: string | null
          payment_recorded_by_name?: string | null
          photo_pupitre_url?: string | null
          prestataire_id?: string | null
          prix_livraison_m3?: number | null
          prix_vente_m3?: number | null
          production_batch_time?: string | null
          quality_status?: string | null
          raison_annulation?: string | null
          sable_reel_kg?: number | null
          source_donnees?: string | null
          statut_paiement?: string
          temps_attente_chantier_minutes?: number | null
          temps_attente_reel_minutes?: number | null
          temps_attente_site?: number | null
          temps_mission_heures?: number | null
          temps_rotation_minutes?: number | null
          toupie_assignee?: string | null
          tracking_token?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validated_by_name?: string | null
          validated_by_role?: string | null
          validation_technique?: boolean | null
          variance_adjuvant_pct?: number | null
          variance_ciment_pct?: number | null
          variance_eau_pct?: number | null
          variance_gravette_pct?: number | null
          variance_sable_pct?: number | null
          volume_m3: number
          volume_perdu?: number | null
          workflow_status?: string | null
          zone_livraison_id?: string | null
        }
        Update: {
          adjuvant_reel_l?: number | null
          affaissement_conforme?: boolean | null
          affaissement_mm?: number | null
          alerte_ecart?: boolean | null
          alerte_marge?: boolean | null
          alerte_planification?: boolean | null
          annule_at?: string | null
          annule_par?: string | null
          assignation_count?: number | null
          bc_id?: string | null
          bl_id?: string
          camion_assigne?: string | null
          chauffeur_nom?: string | null
          ciment_reel_kg?: number
          client_confirmed_at?: string | null
          client_confirmed_by_name?: string | null
          client_id?: string
          client_signature_url?: string | null
          consommation_calculee?: number | null
          created_at?: string
          created_by?: string | null
          cur_reel?: number | null
          date_livraison?: string
          debrief_at?: string | null
          debrief_valide?: boolean | null
          eau_reel_l?: number | null
          ecart_marge?: number | null
          facture_generee?: boolean | null
          facture_id?: string | null
          facturer_attente?: boolean | null
          formule_id?: string
          gravette_reel_kg?: number | null
          heure_arrivee_chantier?: string | null
          heure_depart_centrale?: string | null
          heure_depart_prevue?: string | null
          heure_depart_reelle?: string | null
          heure_prevue?: string | null
          heure_retour_centrale?: string | null
          justification_ecart?: string | null
          km_final?: number | null
          km_parcourus?: number | null
          litres_ajoutes?: number | null
          lock_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          machine_id?: string | null
          marge_brute_pct?: number | null
          mode_paiement?: string | null
          payment_recorded_at?: string | null
          payment_recorded_by?: string | null
          payment_recorded_by_name?: string | null
          photo_pupitre_url?: string | null
          prestataire_id?: string | null
          prix_livraison_m3?: number | null
          prix_vente_m3?: number | null
          production_batch_time?: string | null
          quality_status?: string | null
          raison_annulation?: string | null
          sable_reel_kg?: number | null
          source_donnees?: string | null
          statut_paiement?: string
          temps_attente_chantier_minutes?: number | null
          temps_attente_reel_minutes?: number | null
          temps_attente_site?: number | null
          temps_mission_heures?: number | null
          temps_rotation_minutes?: number | null
          toupie_assignee?: string | null
          tracking_token?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validated_by_name?: string | null
          validated_by_role?: string | null
          validation_technique?: boolean | null
          variance_adjuvant_pct?: number | null
          variance_ciment_pct?: number | null
          variance_eau_pct?: number | null
          variance_gravette_pct?: number | null
          variance_sable_pct?: number | null
          volume_m3?: number
          volume_perdu?: number | null
          workflow_status?: string | null
          zone_livraison_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bons_livraison_reels_camion_assigne_fkey"
            columns: ["camion_assigne"]
            isOneToOne: false
            referencedRelation: "flotte"
            referencedColumns: ["id_camion"]
          },
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
          {
            foreignKeyName: "bons_livraison_reels_prestataire_id_fkey"
            columns: ["prestataire_id"]
            isOneToOne: false
            referencedRelation: "prestataires_transport"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bons_livraison_reels_zone_livraison_id_fkey"
            columns: ["zone_livraison_id"]
            isOneToOne: false
            referencedRelation: "zones_livraison"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_devices: {
        Row: {
          brand: string | null
          capabilities: string[] | null
          config: Json | null
          created_at: string
          hls_url: string | null
          id: string
          ip_address: string | null
          is_active: boolean
          last_heartbeat: string | null
          location: string
          model: string | null
          name: string
          rtsp_url: string | null
          updated_at: string
          zone: string
        }
        Insert: {
          brand?: string | null
          capabilities?: string[] | null
          config?: Json | null
          created_at?: string
          hls_url?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_heartbeat?: string | null
          location: string
          model?: string | null
          name: string
          rtsp_url?: string | null
          updated_at?: string
          zone: string
        }
        Update: {
          brand?: string | null
          capabilities?: string[] | null
          config?: Json | null
          created_at?: string
          hls_url?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_heartbeat?: string | null
          location?: string
          model?: string | null
          name?: string
          rtsp_url?: string | null
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
      camera_events: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          auto_action_taken: string | null
          camera_id: string | null
          created_at: string
          description: string
          details: Json | null
          event_type: string
          id: string
          is_acknowledged: boolean
          matched_bl_id: string | null
          matched_vehicle_id: string | null
          plate_number: string | null
          severity: string
          snapshot_url: string | null
          video_clip_url: string | null
          zone: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          auto_action_taken?: string | null
          camera_id?: string | null
          created_at?: string
          description: string
          details?: Json | null
          event_type: string
          id?: string
          is_acknowledged?: boolean
          matched_bl_id?: string | null
          matched_vehicle_id?: string | null
          plate_number?: string | null
          severity?: string
          snapshot_url?: string | null
          video_clip_url?: string | null
          zone?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          auto_action_taken?: string | null
          camera_id?: string | null
          created_at?: string
          description?: string
          details?: Json | null
          event_type?: string
          id?: string
          is_acknowledged?: boolean
          matched_bl_id?: string | null
          matched_vehicle_id?: string | null
          plate_number?: string | null
          severity?: string
          snapshot_url?: string | null
          video_clip_url?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camera_events_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "camera_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_deposits: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          bank_account: string | null
          bank_reference: string | null
          capital_decision_url: string | null
          client_id: string | null
          created_at: string
          created_by: string
          created_by_name: string | null
          deposit_date: string
          facture_id: string | null
          id: string
          justification_status: string | null
          loan_agreement_url: string | null
          match_variance_pct: number | null
          matched_invoice_amount: number | null
          notes: string | null
          pattern_flags: Json | null
          receipt_photo_url: string
          reference: string
          reimbursement_expense_id: string | null
          source_description: string | null
          source_type: Database["public"]["Enums"]["cash_source_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          bank_account?: string | null
          bank_reference?: string | null
          capital_decision_url?: string | null
          client_id?: string | null
          created_at?: string
          created_by: string
          created_by_name?: string | null
          deposit_date?: string
          facture_id?: string | null
          id?: string
          justification_status?: string | null
          loan_agreement_url?: string | null
          match_variance_pct?: number | null
          matched_invoice_amount?: number | null
          notes?: string | null
          pattern_flags?: Json | null
          receipt_photo_url: string
          reference?: string
          reimbursement_expense_id?: string | null
          source_description?: string | null
          source_type: Database["public"]["Enums"]["cash_source_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          bank_account?: string | null
          bank_reference?: string | null
          capital_decision_url?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          deposit_date?: string
          facture_id?: string | null
          id?: string
          justification_status?: string | null
          loan_agreement_url?: string | null
          match_variance_pct?: number | null
          matched_invoice_amount?: number | null
          notes?: string | null
          pattern_flags?: Json | null
          receipt_photo_url?: string
          reference?: string
          reimbursement_expense_id?: string | null
          source_description?: string | null
          source_type?: Database["public"]["Enums"]["cash_source_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_deposits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      cash_payment_audit: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          decision: string
          decision_reason: string | null
          expense_id: string | null
          fournisseur_id: string | null
          fournisseur_nom: string
          id: string
          monthly_total_after: number
          monthly_total_before: number
          override_by: string | null
          override_by_name: string | null
          payment_method: string
          penalty_amount: number | null
          penalty_applicable: boolean | null
          stamp_duty_amount: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          decision: string
          decision_reason?: string | null
          expense_id?: string | null
          fournisseur_id?: string | null
          fournisseur_nom: string
          id?: string
          monthly_total_after: number
          monthly_total_before: number
          override_by?: string | null
          override_by_name?: string | null
          payment_method: string
          penalty_amount?: number | null
          penalty_applicable?: boolean | null
          stamp_duty_amount?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          decision?: string
          decision_reason?: string | null
          expense_id?: string | null
          fournisseur_id?: string | null
          fournisseur_nom?: string
          id?: string
          monthly_total_after?: number
          monthly_total_before?: number
          override_by?: string | null
          override_by_name?: string | null
          payment_method?: string
          penalty_amount?: number | null
          penalty_applicable?: boolean | null
          stamp_duty_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_payment_audit_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses_controlled"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_payment_audit_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "contract_compliance_summary"
            referencedColumns: ["fournisseur_id"]
          },
          {
            foreignKeyName: "cash_payment_audit_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      ceo_bypass_tokens: {
        Row: {
          amount_limit: number | null
          created_at: string | null
          expires_at: string
          generated_by: string
          generated_for: string
          id: string
          is_active: boolean | null
          reason: string
          token_code: string
          used_at: string | null
          used_by: string | null
          used_for_reference: string | null
        }
        Insert: {
          amount_limit?: number | null
          created_at?: string | null
          expires_at: string
          generated_by: string
          generated_for: string
          id?: string
          is_active?: boolean | null
          reason: string
          token_code: string
          used_at?: string | null
          used_by?: string | null
          used_for_reference?: string | null
        }
        Update: {
          amount_limit?: number | null
          created_at?: string | null
          expires_at?: string
          generated_by?: string
          generated_for?: string
          id?: string
          is_active?: boolean | null
          reason?: string
          token_code?: string
          used_at?: string | null
          used_by?: string | null
          used_for_reference?: string | null
        }
        Relationships: []
      }
      ceo_emergency_codes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bl_id: string
          client_id: string
          code: string
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          reason: string | null
          requested_at: string
          requested_by: string
          status: string
          used_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bl_id: string
          client_id: string
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          requested_at?: string
          requested_by: string
          status?: string
          used_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bl_id?: string
          client_id?: string
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          requested_at?: string
          requested_by?: string
          status?: string
          used_at?: string | null
        }
        Relationships: []
      }
      ceo_emergency_overrides: {
        Row: {
          ceo_user_id: string
          created_at: string
          expires_at: string
          id: string
          is_used: boolean
          override_type: string
          reason: string
          token: string
          used_at: string | null
          used_for_record_id: string | null
        }
        Insert: {
          ceo_user_id: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          override_type: string
          reason: string
          token?: string
          used_at?: string | null
          used_for_record_id?: string | null
        }
        Update: {
          ceo_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          override_type?: string
          reason?: string
          token?: string
          used_at?: string | null
          used_for_record_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          adresse: string | null
          average_days_to_pay: number | null
          client_id: string
          code_postal: string | null
          contact_personne: string | null
          created_at: string
          credit_bloque: boolean | null
          delai_paiement_jours: number | null
          derniere_commande_at: string | null
          disputes_count: number | null
          email: string | null
          ice: string | null
          identifiant_fiscal: string | null
          last_payment_date: string | null
          late_payments: number | null
          limite_credit_dh: number | null
          nom_client: string
          on_time_payments: number | null
          patente: string | null
          payment_score: number | null
          rc: string | null
          rc_document_url: string | null
          solde_du: number | null
          telephone: string | null
          total_invoiced: number | null
          total_paid: number | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          average_days_to_pay?: number | null
          client_id: string
          code_postal?: string | null
          contact_personne?: string | null
          created_at?: string
          credit_bloque?: boolean | null
          delai_paiement_jours?: number | null
          derniere_commande_at?: string | null
          disputes_count?: number | null
          email?: string | null
          ice?: string | null
          identifiant_fiscal?: string | null
          last_payment_date?: string | null
          late_payments?: number | null
          limite_credit_dh?: number | null
          nom_client: string
          on_time_payments?: number | null
          patente?: string | null
          payment_score?: number | null
          rc?: string | null
          rc_document_url?: string | null
          solde_du?: number | null
          telephone?: string | null
          total_invoiced?: number | null
          total_paid?: number | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          average_days_to_pay?: number | null
          client_id?: string
          code_postal?: string | null
          contact_personne?: string | null
          created_at?: string
          credit_bloque?: boolean | null
          delai_paiement_jours?: number | null
          derniere_commande_at?: string | null
          disputes_count?: number | null
          email?: string | null
          ice?: string | null
          identifiant_fiscal?: string | null
          last_payment_date?: string | null
          late_payments?: number | null
          limite_credit_dh?: number | null
          nom_client?: string
          on_time_payments?: number | null
          patente?: string | null
          payment_score?: number | null
          rc?: string | null
          rc_document_url?: string | null
          solde_du?: number | null
          telephone?: string | null
          total_invoiced?: number | null
          total_paid?: number | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      collection_logs: {
        Row: {
          action_date: string
          action_type: string
          bl_id: string | null
          client_id: string
          created_at: string
          facture_id: string | null
          id: string
          metadata: Json | null
          next_action_date: string | null
          notes: string | null
          performed_by: string | null
          performed_by_name: string | null
        }
        Insert: {
          action_date?: string
          action_type: string
          bl_id?: string | null
          client_id: string
          created_at?: string
          facture_id?: string | null
          id?: string
          metadata?: Json | null
          next_action_date?: string | null
          notes?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
        }
        Update: {
          action_date?: string
          action_type?: string
          bl_id?: string | null
          client_id?: string
          created_at?: string
          facture_id?: string | null
          id?: string
          metadata?: Json | null
          next_action_date?: string | null
          notes?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          category: string
          client_id: string
          created_at: string
          id: string
          message_preview: string | null
          metadata: Json | null
          recipient: string | null
          reference_id: string | null
          reference_table: string | null
          sent_by: string | null
          status: string
          subject: string | null
          type: string
        }
        Insert: {
          category: string
          client_id: string
          created_at?: string
          id?: string
          message_preview?: string | null
          metadata?: Json | null
          recipient?: string | null
          reference_id?: string | null
          reference_table?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
          type: string
        }
        Update: {
          category?: string
          client_id?: string
          created_at?: string
          id?: string
          message_preview?: string | null
          metadata?: Json | null
          recipient?: string | null
          reference_id?: string | null
          reference_table?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
          type?: string
        }
        Relationships: []
      }
      consommation_energie: {
        Row: {
          carburant_groupe_l: number | null
          compteur_eau_m3: number | null
          compteur_electrique_kwh: number | null
          cout_carburant_dh: number | null
          cout_eau_dh: number | null
          cout_electricite_dh: number | null
          created_at: string
          created_by: string | null
          date_releve: string
          eau_par_m3: number | null
          id: string
          kwh_par_m3: number | null
          notes: string | null
          volume_produit_m3: number | null
        }
        Insert: {
          carburant_groupe_l?: number | null
          compteur_eau_m3?: number | null
          compteur_electrique_kwh?: number | null
          cout_carburant_dh?: number | null
          cout_eau_dh?: number | null
          cout_electricite_dh?: number | null
          created_at?: string
          created_by?: string | null
          date_releve?: string
          eau_par_m3?: number | null
          id?: string
          kwh_par_m3?: number | null
          notes?: string | null
          volume_produit_m3?: number | null
        }
        Update: {
          carburant_groupe_l?: number | null
          compteur_eau_m3?: number | null
          compteur_electrique_kwh?: number | null
          cout_carburant_dh?: number | null
          cout_eau_dh?: number | null
          cout_electricite_dh?: number | null
          created_at?: string
          created_by?: string | null
          date_releve?: string
          eau_par_m3?: number | null
          id?: string
          kwh_par_m3?: number | null
          notes?: string | null
          volume_produit_m3?: number | null
        }
        Relationships: []
      }
      contract_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_date: string
          alert_type: string
          contract_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_date: string
          alert_type: string
          contract_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_date?: string
          alert_type?: string
          contract_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_alerts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          equipment_count: number | null
          equipment_description: string | null
          fournisseur_id: string | null
          id: string
          is_active: boolean | null
          monthly_amount: number
          pdf_url: string
          provider_name: string
          ras_applicable: boolean | null
          ras_rate: number | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          equipment_count?: number | null
          equipment_description?: string | null
          fournisseur_id?: string | null
          id?: string
          is_active?: boolean | null
          monthly_amount: number
          pdf_url: string
          provider_name: string
          ras_applicable?: boolean | null
          ras_rate?: number | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          equipment_count?: number | null
          equipment_description?: string | null
          fournisseur_id?: string | null
          id?: string
          is_active?: boolean | null
          monthly_amount?: number
          pdf_url?: string
          provider_name?: string
          ras_applicable?: boolean | null
          ras_rate?: number | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "contract_compliance_summary"
            referencedColumns: ["fournisseur_id"]
          },
          {
            foreignKeyName: "contracts_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      controles_depart: {
        Row: {
          affaissement_conforme: boolean
          affaissement_mm: number
          bl_id: string
          correction_eau_appliquee_l: number | null
          created_at: string
          geo_validated: boolean | null
          geo_validation_notes: string | null
          humidite_sable_pct: number | null
          id: string
          notes: string | null
          photo_slump_latitude: number | null
          photo_slump_longitude: number | null
          photo_slump_timestamp: string
          photo_slump_url: string
          photo_texture_latitude: number | null
          photo_texture_longitude: number | null
          photo_texture_timestamp: string
          photo_texture_url: string
          texture_conforme: boolean
          valide_at: string
          valide_par: string
          valide_par_name: string | null
        }
        Insert: {
          affaissement_conforme: boolean
          affaissement_mm: number
          bl_id: string
          correction_eau_appliquee_l?: number | null
          created_at?: string
          geo_validated?: boolean | null
          geo_validation_notes?: string | null
          humidite_sable_pct?: number | null
          id?: string
          notes?: string | null
          photo_slump_latitude?: number | null
          photo_slump_longitude?: number | null
          photo_slump_timestamp?: string
          photo_slump_url: string
          photo_texture_latitude?: number | null
          photo_texture_longitude?: number | null
          photo_texture_timestamp?: string
          photo_texture_url: string
          texture_conforme?: boolean
          valide_at?: string
          valide_par: string
          valide_par_name?: string | null
        }
        Update: {
          affaissement_conforme?: boolean
          affaissement_mm?: number
          bl_id?: string
          correction_eau_appliquee_l?: number | null
          created_at?: string
          geo_validated?: boolean | null
          geo_validation_notes?: string | null
          humidite_sable_pct?: number | null
          id?: string
          notes?: string | null
          photo_slump_latitude?: number | null
          photo_slump_longitude?: number | null
          photo_slump_timestamp?: string
          photo_slump_url?: string
          photo_texture_latitude?: number | null
          photo_texture_longitude?: number | null
          photo_texture_timestamp?: string
          photo_texture_url?: string
          texture_conforme?: boolean
          valide_at?: string
          valide_par?: string
          valide_par_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_bl"
            columns: ["bl_id"]
            isOneToOne: false
            referencedRelation: "bons_livraison_reels"
            referencedColumns: ["bl_id"]
          },
          {
            foreignKeyName: "fk_bl"
            columns: ["bl_id"]
            isOneToOne: false
            referencedRelation: "client_delivery_tracking_view"
            referencedColumns: ["bl_id"]
          },
        ]
      }
      controles_humidite: {
        Row: {
          correction_eau_l_m3: number | null
          created_at: string
          created_by: string
          ecart_humidite_pct: number | null
          id: string
          materiau: string
          notes: string | null
          photo_latitude: number | null
          photo_longitude: number | null
          photo_timestamp: string
          photo_url: string
          reception_id: string | null
          taux_humidite_pct: number
          taux_standard_pct: number
          type_controle: string
          verified_by: string | null
          verified_by_name: string | null
        }
        Insert: {
          correction_eau_l_m3?: number | null
          created_at?: string
          created_by: string
          ecart_humidite_pct?: number | null
          id?: string
          materiau?: string
          notes?: string | null
          photo_latitude?: number | null
          photo_longitude?: number | null
          photo_timestamp?: string
          photo_url: string
          reception_id?: string | null
          taux_humidite_pct: number
          taux_standard_pct?: number
          type_controle: string
          verified_by?: string | null
          verified_by_name?: string | null
        }
        Update: {
          correction_eau_l_m3?: number | null
          created_at?: string
          created_by?: string
          ecart_humidite_pct?: number | null
          id?: string
          materiau?: string
          notes?: string | null
          photo_latitude?: number | null
          photo_longitude?: number | null
          photo_timestamp?: string
          photo_url?: string
          reception_id?: string | null
          taux_humidite_pct?: number
          taux_standard_pct?: number
          type_controle?: string
          verified_by?: string | null
          verified_by_name?: string | null
        }
        Relationships: []
      }
      credit_score_history: {
        Row: {
          account_age_score: number | null
          avg_days_overdue: number | null
          balance_trend_score: number | null
          client_id: string
          created_at: string
          credit_utilization_score: number | null
          delay_frequency_score: number | null
          grade: string
          id: string
          payment_history_score: number | null
          risk_level: string
          score: number
          snapshot_date: string
          total_outstanding: number | null
          total_overdue: number | null
        }
        Insert: {
          account_age_score?: number | null
          avg_days_overdue?: number | null
          balance_trend_score?: number | null
          client_id: string
          created_at?: string
          credit_utilization_score?: number | null
          delay_frequency_score?: number | null
          grade: string
          id?: string
          payment_history_score?: number | null
          risk_level: string
          score: number
          snapshot_date?: string
          total_outstanding?: number | null
          total_overdue?: number | null
        }
        Update: {
          account_age_score?: number | null
          avg_days_overdue?: number | null
          balance_trend_score?: number | null
          client_id?: string
          created_at?: string
          credit_utilization_score?: number | null
          delay_frequency_score?: number | null
          grade?: string
          id?: string
          payment_history_score?: number | null
          risk_level?: string
          score?: number
          snapshot_date?: string
          total_outstanding?: number | null
          total_overdue?: number | null
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          created_at: string
          email: string
          entreprise: string | null
          id: string
          nom_complet: string
          nombre_centrales: number | null
          telephone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          entreprise?: string | null
          id?: string
          nom_complet: string
          nombre_centrales?: number | null
          telephone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          entreprise?: string | null
          id?: string
          nom_complet?: string
          nombre_centrales?: number | null
          telephone?: string | null
        }
        Relationships: []
      }
      department_budgets: {
        Row: {
          alert_threshold_pct: number
          budget_cap: number
          created_at: string
          created_by: string | null
          department: string
          department_label: string
          id: string
          is_active: boolean
          month_year: string
          updated_at: string
        }
        Insert: {
          alert_threshold_pct?: number
          budget_cap?: number
          created_at?: string
          created_by?: string | null
          department: string
          department_label: string
          id?: string
          is_active?: boolean
          month_year: string
          updated_at?: string
        }
        Update: {
          alert_threshold_pct?: number
          budget_cap?: number
          created_at?: string
          created_by?: string | null
          department?: string
          department_label?: string
          id?: string
          is_active?: boolean
          month_year?: string
          updated_at?: string
        }
        Relationships: []
      }
      depenses: {
        Row: {
          categorie: string
          created_at: string
          created_by: string
          date_depense: string
          description: string | null
          id: string
          montant: number
          photo_recu_url: string
          updated_at: string
        }
        Insert: {
          categorie: string
          created_at?: string
          created_by: string
          date_depense?: string
          description?: string | null
          id?: string
          montant: number
          photo_recu_url: string
          updated_at?: string
        }
        Update: {
          categorie?: string
          created_at?: string
          created_by?: string
          date_depense?: string
          description?: string | null
          id?: string
          montant?: number
          photo_recu_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      deposit_pattern_alerts: {
        Row: {
          alert_date: string
          alert_type: string
          created_at: string
          deposit_ids: string[]
          details: Json | null
          id: string
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          risk_level: string | null
          total_amount: number
        }
        Insert: {
          alert_date: string
          alert_type: string
          created_at?: string
          deposit_ids: string[]
          details?: Json | null
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_level?: string | null
          total_amount: number
        }
        Update: {
          alert_date?: string
          alert_type?: string
          created_at?: string
          deposit_ids?: string[]
          details?: Json | null
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_level?: string | null
          total_amount?: number
        }
        Relationships: []
      }
      devis: {
        Row: {
          admin_approval_at: string | null
          admin_approval_by: string | null
          admin_approval_by_name: string | null
          admin_approval_notes: string | null
          admin_approval_status: string | null
          approval_chain_complete: boolean | null
          blocking_reason: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          cut_per_m3: number
          date_expiration: string | null
          devis_id: string
          discrepancies_count: number | null
          distance_km: number
          fixed_cost_per_m3: number
          formule_id: string
          id: string
          is_special_formula: boolean | null
          lock_expires_at: string | null
          locked_at: string | null
          locked_by: string | null
          margin_pct: number
          notes: string | null
          prix_livraison_m3: number | null
          prix_vente_m3: number
          requires_technical_approval: boolean | null
          rollback_count: number
          statut: string
          tech_approval_notes: string | null
          tech_approval_status: string | null
          technical_approved_at: string | null
          technical_approved_by: string | null
          technical_approved_by_name: string | null
          total_cost_per_m3: number
          total_ht: number
          transport_extra_per_m3: number
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validated_by_name: string | null
          validated_by_role: string | null
          validation_score: number | null
          validite_jours: number
          volume_m3: number
          zone_livraison_id: string | null
        }
        Insert: {
          admin_approval_at?: string | null
          admin_approval_by?: string | null
          admin_approval_by_name?: string | null
          admin_approval_notes?: string | null
          admin_approval_status?: string | null
          approval_chain_complete?: boolean | null
          blocking_reason?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          cut_per_m3: number
          date_expiration?: string | null
          devis_id: string
          discrepancies_count?: number | null
          distance_km?: number
          fixed_cost_per_m3?: number
          formule_id: string
          id?: string
          is_special_formula?: boolean | null
          lock_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          margin_pct?: number
          notes?: string | null
          prix_livraison_m3?: number | null
          prix_vente_m3: number
          requires_technical_approval?: boolean | null
          rollback_count?: number
          statut?: string
          tech_approval_notes?: string | null
          tech_approval_status?: string | null
          technical_approved_at?: string | null
          technical_approved_by?: string | null
          technical_approved_by_name?: string | null
          total_cost_per_m3: number
          total_ht: number
          transport_extra_per_m3?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validated_by_name?: string | null
          validated_by_role?: string | null
          validation_score?: number | null
          validite_jours?: number
          volume_m3: number
          zone_livraison_id?: string | null
        }
        Update: {
          admin_approval_at?: string | null
          admin_approval_by?: string | null
          admin_approval_by_name?: string | null
          admin_approval_notes?: string | null
          admin_approval_status?: string | null
          approval_chain_complete?: boolean | null
          blocking_reason?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          cut_per_m3?: number
          date_expiration?: string | null
          devis_id?: string
          discrepancies_count?: number | null
          distance_km?: number
          fixed_cost_per_m3?: number
          formule_id?: string
          id?: string
          is_special_formula?: boolean | null
          lock_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          margin_pct?: number
          notes?: string | null
          prix_livraison_m3?: number | null
          prix_vente_m3?: number
          requires_technical_approval?: boolean | null
          rollback_count?: number
          statut?: string
          tech_approval_notes?: string | null
          tech_approval_status?: string | null
          technical_approved_at?: string | null
          technical_approved_by?: string | null
          technical_approved_by_name?: string | null
          total_cost_per_m3?: number
          total_ht?: number
          transport_extra_per_m3?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validated_by_name?: string | null
          validated_by_role?: string | null
          validation_score?: number | null
          validite_jours?: number
          volume_m3?: number
          zone_livraison_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "devis_formule_id_fkey"
            columns: ["formule_id"]
            isOneToOne: false
            referencedRelation: "formules_theoriques"
            referencedColumns: ["formule_id"]
          },
          {
            foreignKeyName: "devis_zone_livraison_id_fkey"
            columns: ["zone_livraison_id"]
            isOneToOne: false
            referencedRelation: "zones_livraison"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_bc_action_history: {
        Row: {
          action_item_id: string | null
          changed_by: string | null
          changed_by_name: string | null
          created_at: string | null
          id: string
          new_status: string
          notes: string | null
          previous_status: string | null
        }
        Insert: {
          action_item_id?: string | null
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          notes?: string | null
          previous_status?: string | null
        }
        Update: {
          action_item_id?: string | null
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_bc_action_history_action_item_id_fkey"
            columns: ["action_item_id"]
            isOneToOne: false
            referencedRelation: "emergency_bc_action_items"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_bc_action_items: {
        Row: {
          action_code: string
          action_name: string
          action_type: string
          assigned_to: string
          assigned_to_email: string | null
          assigned_to_phone: string | null
          assigned_to_role: string
          bc_id: string
          checklist: Json | null
          completed_at: string | null
          completed_by: string | null
          completed_by_name: string | null
          completion_notes: string | null
          created_at: string | null
          deadline_at: string | null
          deadline_minutes: number
          escalate_to: string | null
          escalate_to_email: string | null
          escalate_to_phone: string | null
          escalated: boolean | null
          escalated_at: string | null
          escalated_reason: string | null
          escalation_after_minutes: number | null
          id: string
          notification_id: string | null
          phase: number
          phase_name: string
          priority: string
          started_at: string | null
          status: string
          steps: Json | null
          success_criteria: Json | null
          updated_at: string | null
        }
        Insert: {
          action_code: string
          action_name: string
          action_type: string
          assigned_to: string
          assigned_to_email?: string | null
          assigned_to_phone?: string | null
          assigned_to_role: string
          bc_id: string
          checklist?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          completion_notes?: string | null
          created_at?: string | null
          deadline_at?: string | null
          deadline_minutes: number
          escalate_to?: string | null
          escalate_to_email?: string | null
          escalate_to_phone?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          escalated_reason?: string | null
          escalation_after_minutes?: number | null
          id?: string
          notification_id?: string | null
          phase: number
          phase_name: string
          priority?: string
          started_at?: string | null
          status?: string
          steps?: Json | null
          success_criteria?: Json | null
          updated_at?: string | null
        }
        Update: {
          action_code?: string
          action_name?: string
          action_type?: string
          assigned_to?: string
          assigned_to_email?: string | null
          assigned_to_phone?: string | null
          assigned_to_role?: string
          bc_id?: string
          checklist?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          completion_notes?: string | null
          created_at?: string | null
          deadline_at?: string | null
          deadline_minutes?: number
          escalate_to?: string | null
          escalate_to_email?: string | null
          escalate_to_phone?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          escalated_reason?: string | null
          escalation_after_minutes?: number | null
          id?: string
          notification_id?: string | null
          phase?: number
          phase_name?: string
          priority?: string
          started_at?: string | null
          status?: string
          steps?: Json | null
          success_criteria?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_bc_action_items_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "emergency_bc_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_bc_approvals: {
        Row: {
          approval_notes: string | null
          approval_timeout_minutes: number
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          bc_id: string
          bc_uuid: string | null
          created_at: string
          delivery_date: string
          emergency_condition: string
          emergency_reason: string
          expires_at: string
          id: string
          notified_production: boolean | null
          notified_production_at: string | null
          notified_resp_technique: boolean | null
          notified_resp_technique_at: string | null
          requested_at: string
          requested_by: string
          requested_by_name: string | null
          status: string
        }
        Insert: {
          approval_notes?: string | null
          approval_timeout_minutes?: number
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          bc_id: string
          bc_uuid?: string | null
          created_at?: string
          delivery_date: string
          emergency_condition: string
          emergency_reason: string
          expires_at: string
          id?: string
          notified_production?: boolean | null
          notified_production_at?: string | null
          notified_resp_technique?: boolean | null
          notified_resp_technique_at?: string | null
          requested_at?: string
          requested_by: string
          requested_by_name?: string | null
          status?: string
        }
        Update: {
          approval_notes?: string | null
          approval_timeout_minutes?: number
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          bc_id?: string
          bc_uuid?: string | null
          created_at?: string
          delivery_date?: string
          emergency_condition?: string
          emergency_reason?: string
          expires_at?: string
          id?: string
          notified_production?: boolean | null
          notified_production_at?: string | null
          notified_resp_technique?: boolean | null
          notified_resp_technique_at?: string | null
          requested_at?: string
          requested_by?: string
          requested_by_name?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_bc_approvals_bc_uuid_fkey"
            columns: ["bc_uuid"]
            isOneToOne: false
            referencedRelation: "bons_commande"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_bc_notifications: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          acknowledged_by_name: string | null
          action_items_completed: Json | null
          approval_id: string | null
          bc_approved_at: string | null
          bc_approved_by: string | null
          bc_approved_by_role: string | null
          bc_id: string
          bc_status: string | null
          bc_uuid: string | null
          created_at: string
          data_fields: Json
          delivery_address: string | null
          delivery_date: string | null
          delivery_time_window: string | null
          emergency_reason: string | null
          emergency_trigger: string | null
          expected_arrival: string | null
          id: string
          material_code: string | null
          material_name: string | null
          material_type: string | null
          notification_id: string
          notification_type: string
          production_impact: string | null
          quality_decision: string | null
          quality_decision_at: string | null
          quality_decision_by: string | null
          quality_decision_notes: string | null
          quality_grade: string | null
          quantity: number | null
          quantity_unit: string | null
          read: boolean | null
          read_at: string | null
          recipient_email: string | null
          recipient_id: string | null
          recipient_name: string | null
          recipient_phone: string | null
          recipient_role: string
          sent: boolean | null
          sent_at: string | null
          sent_via: string[] | null
          severity: string
          supplier_contact: string | null
          supplier_email: string | null
          supplier_id: string | null
          supplier_name: string | null
          supplier_phone: string | null
          updated_at: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledged_by_name?: string | null
          action_items_completed?: Json | null
          approval_id?: string | null
          bc_approved_at?: string | null
          bc_approved_by?: string | null
          bc_approved_by_role?: string | null
          bc_id: string
          bc_status?: string | null
          bc_uuid?: string | null
          created_at?: string
          data_fields?: Json
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_time_window?: string | null
          emergency_reason?: string | null
          emergency_trigger?: string | null
          expected_arrival?: string | null
          id?: string
          material_code?: string | null
          material_name?: string | null
          material_type?: string | null
          notification_id: string
          notification_type: string
          production_impact?: string | null
          quality_decision?: string | null
          quality_decision_at?: string | null
          quality_decision_by?: string | null
          quality_decision_notes?: string | null
          quality_grade?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          read?: boolean | null
          read_at?: string | null
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_role: string
          sent?: boolean | null
          sent_at?: string | null
          sent_via?: string[] | null
          severity?: string
          supplier_contact?: string | null
          supplier_email?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          updated_at?: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledged_by_name?: string | null
          action_items_completed?: Json | null
          approval_id?: string | null
          bc_approved_at?: string | null
          bc_approved_by?: string | null
          bc_approved_by_role?: string | null
          bc_id?: string
          bc_status?: string | null
          bc_uuid?: string | null
          created_at?: string
          data_fields?: Json
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_time_window?: string | null
          emergency_reason?: string | null
          emergency_trigger?: string | null
          expected_arrival?: string | null
          id?: string
          material_code?: string | null
          material_name?: string | null
          material_type?: string | null
          notification_id?: string
          notification_type?: string
          production_impact?: string | null
          quality_decision?: string | null
          quality_decision_at?: string | null
          quality_decision_by?: string | null
          quality_decision_notes?: string | null
          quality_grade?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          read?: boolean | null
          read_at?: string | null
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_role?: string
          sent?: boolean | null
          sent_at?: string | null
          sent_via?: string[] | null
          severity?: string
          supplier_contact?: string | null
          supplier_email?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_bc_notifications_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "emergency_bc_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_bc_notifications_bc_uuid_fkey"
            columns: ["bc_uuid"]
            isOneToOne: false
            referencedRelation: "bons_commande"
            referencedColumns: ["id"]
          },
        ]
      }
      employes: {
        Row: {
          actif: boolean
          created_at: string
          id: string
          nom: string
          prenom: string
          role: string
          telephone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id?: string
          nom: string
          prenom: string
          role?: string
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actif?: boolean
          created_at?: string
          id?: string
          nom?: string
          prenom?: string
          role?: string
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      equipements: {
        Row: {
          code_equipement: string
          created_at: string
          criticite: string
          date_installation: string | null
          dernier_etalonnage_at: string | null
          derniere_maintenance_at: string | null
          heures_fonctionnement: number | null
          id: string
          marque: string | null
          modele: string | null
          nom: string
          notes: string | null
          numero_serie: string | null
          photo_url: string | null
          prochain_etalonnage_at: string | null
          prochaine_maintenance_at: string | null
          statut: string
          type: string
          updated_at: string
        }
        Insert: {
          code_equipement: string
          created_at?: string
          criticite?: string
          date_installation?: string | null
          dernier_etalonnage_at?: string | null
          derniere_maintenance_at?: string | null
          heures_fonctionnement?: number | null
          id?: string
          marque?: string | null
          modele?: string | null
          nom: string
          notes?: string | null
          numero_serie?: string | null
          photo_url?: string | null
          prochain_etalonnage_at?: string | null
          prochaine_maintenance_at?: string | null
          statut?: string
          type: string
          updated_at?: string
        }
        Update: {
          code_equipement?: string
          created_at?: string
          criticite?: string
          date_installation?: string | null
          dernier_etalonnage_at?: string | null
          derniere_maintenance_at?: string | null
          heures_fonctionnement?: number | null
          id?: string
          marque?: string | null
          modele?: string | null
          nom?: string
          notes?: string | null
          numero_serie?: string | null
          photo_url?: string | null
          prochain_etalonnage_at?: string | null
          prochaine_maintenance_at?: string | null
          statut?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      escalation_config: {
        Row: {
          created_at: string | null
          escalation_delay_minutes: number
          escalation_targets: Json
          id: string
          is_active: boolean | null
          max_escalation_level: number
          niveau: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          escalation_delay_minutes?: number
          escalation_targets?: Json
          id?: string
          is_active?: boolean | null
          max_escalation_level?: number
          niveau: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          escalation_delay_minutes?: number
          escalation_targets?: Json
          id?: string
          is_active?: boolean | null
          max_escalation_level?: number
          niveau?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      escalation_contacts: {
        Row: {
          availability: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          level: number
          name: string
          phone: string | null
          response_time_sla_minutes: number | null
          role: string
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          level: number
          name: string
          phone?: string | null
          response_time_sla_minutes?: number | null
          role: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          name?: string
          phone?: string | null
          response_time_sla_minutes?: number | null
          role?: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      etalonnages: {
        Row: {
          ajustements_effectues: string | null
          certificat_url: string | null
          conforme: boolean
          created_at: string
          created_by: string | null
          date_etalonnage: string
          ecart_pct: number | null
          equipement_id: string
          id: string
          notes: string | null
          organisme_certificateur: string | null
          prochaine_date: string | null
          reference_certificat: string | null
          technicien: string
          tolerance_pct: number | null
          type_etalonnage: string
          valeur_mesuree: number | null
          valeur_reference: number | null
        }
        Insert: {
          ajustements_effectues?: string | null
          certificat_url?: string | null
          conforme?: boolean
          created_at?: string
          created_by?: string | null
          date_etalonnage?: string
          ecart_pct?: number | null
          equipement_id: string
          id?: string
          notes?: string | null
          organisme_certificateur?: string | null
          prochaine_date?: string | null
          reference_certificat?: string | null
          technicien: string
          tolerance_pct?: number | null
          type_etalonnage: string
          valeur_mesuree?: number | null
          valeur_reference?: number | null
        }
        Update: {
          ajustements_effectues?: string | null
          certificat_url?: string | null
          conforme?: boolean
          created_at?: string
          created_by?: string | null
          date_etalonnage?: string
          ecart_pct?: number | null
          equipement_id?: string
          id?: string
          notes?: string | null
          organisme_certificateur?: string | null
          prochaine_date?: string | null
          reference_certificat?: string | null
          technicien?: string
          tolerance_pct?: number | null
          type_etalonnage?: string
          valeur_mesuree?: number | null
          valeur_reference?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "etalonnages_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses_controlled: {
        Row: {
          approval_level: Database["public"]["Enums"]["expense_approval_level"]
          cap_override_by: string | null
          cap_override_reason: string | null
          cash_limit_override_at: string | null
          cash_limit_override_by: string | null
          cash_limit_override_reason: string | null
          cash_penalty_amount: number | null
          cash_stamp_duty: number | null
          categorie: Database["public"]["Enums"]["expense_category"]
          contract_id: string | null
          created_at: string | null
          department: string | null
          description: string
          fournisseur_id: string | null
          fournisseur_nom: string | null
          id: string
          kilometrage: number | null
          level1_approved_at: string | null
          level1_approved_by: string | null
          level1_approved_by_name: string | null
          level1_notes: string | null
          level2_approved_at: string | null
          level2_approved_by: string | null
          level2_approved_by_name: string | null
          level2_notes: string | null
          level3_approved_at: string | null
          level3_approved_by: string | null
          level3_approved_by_name: string | null
          level3_notes: string | null
          montant_ht: number
          montant_ttc: number
          month_year: string | null
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          payment_method: string | null
          payment_reference: string | null
          ras_amount: number | null
          receipt_photo_url: string | null
          receipt_verified: boolean | null
          reference: string
          rejected_at: string | null
          rejected_by: string | null
          rejected_by_name: string | null
          rejection_reason: string | null
          requested_at: string | null
          requested_by: string
          requested_by_name: string | null
          sous_categorie: string | null
          statut: Database["public"]["Enums"]["expense_status"]
          tva_pct: number | null
          updated_at: string | null
          vehicule_id: string | null
          was_blocked_by_cap: boolean | null
        }
        Insert: {
          approval_level: Database["public"]["Enums"]["expense_approval_level"]
          cap_override_by?: string | null
          cap_override_reason?: string | null
          cash_limit_override_at?: string | null
          cash_limit_override_by?: string | null
          cash_limit_override_reason?: string | null
          cash_penalty_amount?: number | null
          cash_stamp_duty?: number | null
          categorie: Database["public"]["Enums"]["expense_category"]
          contract_id?: string | null
          created_at?: string | null
          department?: string | null
          description: string
          fournisseur_id?: string | null
          fournisseur_nom?: string | null
          id?: string
          kilometrage?: number | null
          level1_approved_at?: string | null
          level1_approved_by?: string | null
          level1_approved_by_name?: string | null
          level1_notes?: string | null
          level2_approved_at?: string | null
          level2_approved_by?: string | null
          level2_approved_by_name?: string | null
          level2_notes?: string | null
          level3_approved_at?: string | null
          level3_approved_by?: string | null
          level3_approved_by_name?: string | null
          level3_notes?: string | null
          montant_ht: number
          montant_ttc: number
          month_year?: string | null
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          ras_amount?: number | null
          receipt_photo_url?: string | null
          receipt_verified?: boolean | null
          reference?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejected_by_name?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by: string
          requested_by_name?: string | null
          sous_categorie?: string | null
          statut?: Database["public"]["Enums"]["expense_status"]
          tva_pct?: number | null
          updated_at?: string | null
          vehicule_id?: string | null
          was_blocked_by_cap?: boolean | null
        }
        Update: {
          approval_level?: Database["public"]["Enums"]["expense_approval_level"]
          cap_override_by?: string | null
          cap_override_reason?: string | null
          cash_limit_override_at?: string | null
          cash_limit_override_by?: string | null
          cash_limit_override_reason?: string | null
          cash_penalty_amount?: number | null
          cash_stamp_duty?: number | null
          categorie?: Database["public"]["Enums"]["expense_category"]
          contract_id?: string | null
          created_at?: string | null
          department?: string | null
          description?: string
          fournisseur_id?: string | null
          fournisseur_nom?: string | null
          id?: string
          kilometrage?: number | null
          level1_approved_at?: string | null
          level1_approved_by?: string | null
          level1_approved_by_name?: string | null
          level1_notes?: string | null
          level2_approved_at?: string | null
          level2_approved_by?: string | null
          level2_approved_by_name?: string | null
          level2_notes?: string | null
          level3_approved_at?: string | null
          level3_approved_by?: string | null
          level3_approved_by_name?: string | null
          level3_notes?: string | null
          montant_ht?: number
          montant_ttc?: number
          month_year?: string | null
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          ras_amount?: number | null
          receipt_photo_url?: string | null
          receipt_verified?: boolean | null
          reference?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejected_by_name?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by?: string
          requested_by_name?: string | null
          sous_categorie?: string | null
          statut?: Database["public"]["Enums"]["expense_status"]
          tva_pct?: number | null
          updated_at?: string | null
          vehicule_id?: string | null
          was_blocked_by_cap?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_controlled_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_controlled_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "contract_compliance_summary"
            referencedColumns: ["fournisseur_id"]
          },
          {
            foreignKeyName: "expenses_controlled_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          bc_id: string | null
          bl_id: string
          bls_inclus: string[] | null
          client_id: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          created_by_role: string | null
          cur_reel: number | null
          date_facture: string
          facture_id: string
          formule_id: string
          id: string
          is_consolidee: boolean | null
          lock_expires_at: string | null
          locked_at: string | null
          locked_by: string | null
          marge_brute_dh: number | null
          marge_brute_pct: number | null
          mode_paiement: string | null
          prix_livraison_m3: number | null
          prix_vente_m3: number
          statut: string
          total_ht: number
          total_ttc: number
          tva_pct: number
          updated_at: string
          volume_m3: number
        }
        Insert: {
          bc_id?: string | null
          bl_id: string
          bls_inclus?: string[] | null
          client_id: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          created_by_role?: string | null
          cur_reel?: number | null
          date_facture?: string
          facture_id: string
          formule_id: string
          id?: string
          is_consolidee?: boolean | null
          lock_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          marge_brute_dh?: number | null
          marge_brute_pct?: number | null
          mode_paiement?: string | null
          prix_livraison_m3?: number | null
          prix_vente_m3: number
          statut?: string
          total_ht: number
          total_ttc: number
          tva_pct?: number
          updated_at?: string
          volume_m3: number
        }
        Update: {
          bc_id?: string | null
          bl_id?: string
          bls_inclus?: string[] | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          created_by_role?: string | null
          cur_reel?: number | null
          date_facture?: string
          facture_id?: string
          formule_id?: string
          id?: string
          is_consolidee?: boolean | null
          lock_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          marge_brute_dh?: number | null
          marge_brute_pct?: number | null
          mode_paiement?: string | null
          prix_livraison_m3?: number | null
          prix_vente_m3?: number
          statut?: string
          total_ht?: number
          total_ttc?: number
          tva_pct?: number
          updated_at?: string
          volume_m3?: number
        }
        Relationships: []
      }
      factures_fournisseur: {
        Row: {
          achat_id: string | null
          created_at: string
          date_echeance: string
          date_facture: string
          fournisseur_id: string
          id: string
          montant_ht: number
          montant_paye: number | null
          montant_ttc: number
          numero_facture: string
          statut: string
          tva: number
          updated_at: string
        }
        Insert: {
          achat_id?: string | null
          created_at?: string
          date_echeance: string
          date_facture?: string
          fournisseur_id: string
          id?: string
          montant_ht: number
          montant_paye?: number | null
          montant_ttc: number
          numero_facture: string
          statut?: string
          tva?: number
          updated_at?: string
        }
        Update: {
          achat_id?: string | null
          created_at?: string
          date_echeance?: string
          date_facture?: string
          fournisseur_id?: string
          id?: string
          montant_ht?: number
          montant_paye?: number | null
          montant_ttc?: number
          numero_facture?: string
          statut?: string
          tva?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_fournisseur_achat_id_fkey"
            columns: ["achat_id"]
            isOneToOne: false
            referencedRelation: "achats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_fournisseur_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "contract_compliance_summary"
            referencedColumns: ["fournisseur_id"]
          },
          {
            foreignKeyName: "factures_fournisseur_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_assets: {
        Row: {
          accumulated_depreciation: number
          asset_id: string
          barcode: string | null
          category: Database["public"]["Enums"]["asset_category"]
          created_at: string
          created_by: string | null
          created_by_name: string | null
          depreciation_method: Database["public"]["Enums"]["depreciation_method"]
          depreciation_start_date: string
          description: string
          documents: Json | null
          id: string
          invoice_number: string | null
          invoice_url: string | null
          location: string
          monthly_depreciation: number
          net_book_value: number
          photos: Json | null
          purchase_date: string
          purchase_price: number
          residual_value: number
          responsible_person: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["asset_status"]
          supplier_id: string | null
          updated_at: string
          updated_by: string | null
          updated_by_name: string | null
          useful_life_months: number
          warranty_certificate_url: string | null
          warranty_end_date: string | null
        }
        Insert: {
          accumulated_depreciation?: number
          asset_id: string
          barcode?: string | null
          category: Database["public"]["Enums"]["asset_category"]
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          depreciation_method?: Database["public"]["Enums"]["depreciation_method"]
          depreciation_start_date: string
          description: string
          documents?: Json | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          location?: string
          monthly_depreciation: number
          net_book_value: number
          photos?: Json | null
          purchase_date: string
          purchase_price: number
          residual_value?: number
          responsible_person?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
          useful_life_months: number
          warranty_certificate_url?: string | null
          warranty_end_date?: string | null
        }
        Update: {
          accumulated_depreciation?: number
          asset_id?: string
          barcode?: string | null
          category?: Database["public"]["Enums"]["asset_category"]
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          depreciation_method?: Database["public"]["Enums"]["depreciation_method"]
          depreciation_start_date?: string
          description?: string
          documents?: Json | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          location?: string
          monthly_depreciation?: number
          net_book_value?: number
          photos?: Json | null
          purchase_date?: string
          purchase_price?: number
          residual_value?: number
          responsible_person?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
          useful_life_months?: number
          warranty_certificate_url?: string | null
          warranty_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixed_assets_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "contract_compliance_summary"
            referencedColumns: ["fournisseur_id"]
          },
          {
            foreignKeyName: "fixed_assets_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_service_records: {
        Row: {
          cout_main_oeuvre: number | null
          cout_pieces: number | null
          cout_total: number | null
          created_at: string
          date_service: string
          description: string | null
          effectue_par: string | null
          effectue_par_name: string | null
          id: string
          id_camion: string
          km_at_service: number
          notes: string | null
          photo_facture_url: string | null
          photo_pieces_url: string | null
          pieces_utilisees: string[] | null
          prestataire: string | null
          service_type: string
          updated_at: string
        }
        Insert: {
          cout_main_oeuvre?: number | null
          cout_pieces?: number | null
          cout_total?: number | null
          created_at?: string
          date_service?: string
          description?: string | null
          effectue_par?: string | null
          effectue_par_name?: string | null
          id?: string
          id_camion: string
          km_at_service: number
          notes?: string | null
          photo_facture_url?: string | null
          photo_pieces_url?: string | null
          pieces_utilisees?: string[] | null
          prestataire?: string | null
          service_type: string
          updated_at?: string
        }
        Update: {
          cout_main_oeuvre?: number | null
          cout_pieces?: number | null
          cout_total?: number | null
          created_at?: string
          date_service?: string
          description?: string | null
          effectue_par?: string | null
          effectue_par_name?: string | null
          id?: string
          id_camion?: string
          km_at_service?: number
          notes?: string | null
          photo_facture_url?: string | null
          photo_pieces_url?: string | null
          pieces_utilisees?: string[] | null
          prestataire?: string | null
          service_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_service_records_id_camion_fkey"
            columns: ["id_camion"]
            isOneToOne: false
            referencedRelation: "flotte"
            referencedColumns: ["id_camion"]
          },
        ]
      }
      flotte: {
        Row: {
          bc_mission_id: string | null
          capacite_m3: number | null
          chauffeur: string | null
          created_at: string
          date_last_visite_technique: string | null
          date_next_visite_technique: string | null
          derniere_maintenance_at: string | null
          gps_device_id: string | null
          gps_enabled: boolean
          gps_imei: string | null
          gps_provider: string | null
          id: string
          id_camion: string
          immatriculation: string | null
          is_interne: boolean
          is_moving: boolean | null
          km_compteur: number | null
          km_last_pneumatiques: number | null
          km_last_vidange: number | null
          last_fuel_level_pct: number | null
          last_gps_update: string | null
          last_heading: number | null
          last_latitude: number | null
          last_longitude: number | null
          last_speed_kmh: number | null
          maintenance_status: string | null
          mission_updated_at: string | null
          notes: string | null
          prochaine_maintenance_at: string | null
          proprietaire: string
          statut: string
          stopped_since: string | null
          telephone_chauffeur: string | null
          type: string
          updated_at: string
        }
        Insert: {
          bc_mission_id?: string | null
          capacite_m3?: number | null
          chauffeur?: string | null
          created_at?: string
          date_last_visite_technique?: string | null
          date_next_visite_technique?: string | null
          derniere_maintenance_at?: string | null
          gps_device_id?: string | null
          gps_enabled?: boolean
          gps_imei?: string | null
          gps_provider?: string | null
          id?: string
          id_camion: string
          immatriculation?: string | null
          is_interne?: boolean
          is_moving?: boolean | null
          km_compteur?: number | null
          km_last_pneumatiques?: number | null
          km_last_vidange?: number | null
          last_fuel_level_pct?: number | null
          last_gps_update?: string | null
          last_heading?: number | null
          last_latitude?: number | null
          last_longitude?: number | null
          last_speed_kmh?: number | null
          maintenance_status?: string | null
          mission_updated_at?: string | null
          notes?: string | null
          prochaine_maintenance_at?: string | null
          proprietaire?: string
          statut?: string
          stopped_since?: string | null
          telephone_chauffeur?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          bc_mission_id?: string | null
          capacite_m3?: number | null
          chauffeur?: string | null
          created_at?: string
          date_last_visite_technique?: string | null
          date_next_visite_technique?: string | null
          derniere_maintenance_at?: string | null
          gps_device_id?: string | null
          gps_enabled?: boolean
          gps_imei?: string | null
          gps_provider?: string | null
          id?: string
          id_camion?: string
          immatriculation?: string | null
          is_interne?: boolean
          is_moving?: boolean | null
          km_compteur?: number | null
          km_last_pneumatiques?: number | null
          km_last_vidange?: number | null
          last_fuel_level_pct?: number | null
          last_gps_update?: string | null
          last_heading?: number | null
          last_latitude?: number | null
          last_longitude?: number | null
          last_speed_kmh?: number | null
          maintenance_status?: string | null
          mission_updated_at?: string | null
          notes?: string | null
          prochaine_maintenance_at?: string | null
          proprietaire?: string
          statut?: string
          stopped_since?: string | null
          telephone_chauffeur?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      forensic_blackbox: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          actor_role: string | null
          created_at: string | null
          event_type: string
          id: string
          intent_analysis: string | null
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          risk_score: number | null
          session_fingerprint: string | null
          severity: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          intent_analysis?: string | null
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          risk_score?: number | null
          session_fingerprint?: string | null
          severity: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          intent_analysis?: string | null
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          risk_score?: number | null
          session_fingerprint?: string | null
          severity?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      formules_theoriques: {
        Row: {
          adjuvant_l_m3: number
          affaissement_cible_mm: number | null
          affaissement_tolerance_mm: number | null
          ciment_kg_m3: number
          created_at: string
          cut_dh_m3: number | null
          designation: string
          eau_l_m3: number
          formule_id: string
          gravette_m3: number | null
          gravier_kg_m3: number | null
          resistance_cible_28j_mpa: number | null
          sable_kg_m3: number | null
          sable_m3: number | null
          updated_at: string
        }
        Insert: {
          adjuvant_l_m3?: number
          affaissement_cible_mm?: number | null
          affaissement_tolerance_mm?: number | null
          ciment_kg_m3: number
          created_at?: string
          cut_dh_m3?: number | null
          designation: string
          eau_l_m3: number
          formule_id: string
          gravette_m3?: number | null
          gravier_kg_m3?: number | null
          resistance_cible_28j_mpa?: number | null
          sable_kg_m3?: number | null
          sable_m3?: number | null
          updated_at?: string
        }
        Update: {
          adjuvant_l_m3?: number
          affaissement_cible_mm?: number | null
          affaissement_tolerance_mm?: number | null
          ciment_kg_m3?: number
          created_at?: string
          cut_dh_m3?: number | null
          designation?: string
          eau_l_m3?: number
          formule_id?: string
          gravette_m3?: number | null
          gravier_kg_m3?: number | null
          resistance_cible_28j_mpa?: number | null
          sable_kg_m3?: number | null
          sable_m3?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      fournisseurs: {
        Row: {
          actif: boolean | null
          adresse: string | null
          average_days_to_pay: number | null
          code_fournisseur: string
          conditions_paiement: string | null
          contact_email: string | null
          contact_nom: string | null
          contact_telephone: string | null
          created_at: string
          delai_livraison_jours: number | null
          discount_terms: string | null
          id: string
          last_payment_date: string | null
          late_payments: number | null
          nom_fournisseur: string
          note_qualite: number | null
          on_time_payments: number | null
          preferred_payment_method: string | null
          reliability_score: number | null
          total_ordered: number | null
          total_paid: number | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          actif?: boolean | null
          adresse?: string | null
          average_days_to_pay?: number | null
          code_fournisseur: string
          conditions_paiement?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string
          delai_livraison_jours?: number | null
          discount_terms?: string | null
          id?: string
          last_payment_date?: string | null
          late_payments?: number | null
          nom_fournisseur: string
          note_qualite?: number | null
          on_time_payments?: number | null
          preferred_payment_method?: string | null
          reliability_score?: number | null
          total_ordered?: number | null
          total_paid?: number | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          actif?: boolean | null
          adresse?: string | null
          average_days_to_pay?: number | null
          code_fournisseur?: string
          conditions_paiement?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string
          delai_livraison_jours?: number | null
          discount_terms?: string | null
          id?: string
          last_payment_date?: string | null
          late_payments?: number | null
          nom_fournisseur?: string
          note_qualite?: number | null
          on_time_payments?: number | null
          preferred_payment_method?: string | null
          reliability_score?: number | null
          total_ordered?: number | null
          total_paid?: number | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      geofence_events: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          duration_minutes: number | null
          event_type: string
          geofence_id: string | null
          id: string
          id_camion: string
          latitude: number
          longitude: number
          notes: string | null
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          duration_minutes?: number | null
          event_type: string
          geofence_id?: string | null
          id?: string
          id_camion: string
          latitude: number
          longitude: number
          notes?: string | null
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          duration_minutes?: number | null
          event_type?: string
          geofence_id?: string | null
          id?: string
          id_camion?: string
          latitude?: number
          longitude?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geofence_events_geofence_id_fkey"
            columns: ["geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofence_events_id_camion_fkey"
            columns: ["id_camion"]
            isOneToOne: false
            referencedRelation: "flotte"
            referencedColumns: ["id_camion"]
          },
        ]
      }
      geofences: {
        Row: {
          client_id: string | null
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters: number
          type: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters?: number
          type: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      gps_positions: {
        Row: {
          accuracy_m: number | null
          altitude_m: number | null
          created_at: string
          fuel_level_pct: number | null
          heading: number | null
          id: string
          id_camion: string
          latitude: number
          longitude: number
          recorded_at: string
          source: string
          speed_kmh: number | null
        }
        Insert: {
          accuracy_m?: number | null
          altitude_m?: number | null
          created_at?: string
          fuel_level_pct?: number | null
          heading?: number | null
          id?: string
          id_camion: string
          latitude: number
          longitude: number
          recorded_at?: string
          source?: string
          speed_kmh?: number | null
        }
        Update: {
          accuracy_m?: number | null
          altitude_m?: number | null
          created_at?: string
          fuel_level_pct?: number | null
          heading?: number | null
          id?: string
          id_camion?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          source?: string
          speed_kmh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gps_positions_id_camion_fkey"
            columns: ["id_camion"]
            isOneToOne: false
            referencedRelation: "flotte"
            referencedColumns: ["id_camion"]
          },
        ]
      }
      incidents_centrale: {
        Row: {
          actions_correctives: string | null
          cause_racine: string | null
          created_at: string
          date_incident: string
          description: string
          duree_arret_heures: number | null
          equipement_id: string | null
          id: string
          impact_production: boolean | null
          niveau_gravite: string
          photos: string[] | null
          resolu: boolean
          resolu_at: string | null
          resolu_par: string | null
          resolution_description: string | null
          signale_par: string
          titre: string
          type_incident: string
          updated_at: string
          volume_perdu_m3: number | null
        }
        Insert: {
          actions_correctives?: string | null
          cause_racine?: string | null
          created_at?: string
          date_incident?: string
          description: string
          duree_arret_heures?: number | null
          equipement_id?: string | null
          id?: string
          impact_production?: boolean | null
          niveau_gravite?: string
          photos?: string[] | null
          resolu?: boolean
          resolu_at?: string | null
          resolu_par?: string | null
          resolution_description?: string | null
          signale_par: string
          titre: string
          type_incident: string
          updated_at?: string
          volume_perdu_m3?: number | null
        }
        Update: {
          actions_correctives?: string | null
          cause_racine?: string | null
          created_at?: string
          date_incident?: string
          description?: string
          duree_arret_heures?: number | null
          equipement_id?: string | null
          id?: string
          impact_production?: boolean | null
          niveau_gravite?: string
          photos?: string[] | null
          resolu?: boolean
          resolu_at?: string | null
          resolu_par?: string | null
          resolution_description?: string | null
          signale_par?: string
          titre?: string
          type_incident?: string
          updated_at?: string
          volume_perdu_m3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_centrale_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents_flotte: {
        Row: {
          bc_id: string | null
          bl_id: string | null
          camion_rescue: string | null
          ceo_notified: boolean | null
          ceo_notified_at: string | null
          created_at: string
          created_by: string | null
          date_incident: string
          description: string
          id: string
          id_camion: string
          resolu: boolean | null
          resolu_at: string | null
          resolution_notes: string | null
          type_incident: string
          volume_perdu: number | null
        }
        Insert: {
          bc_id?: string | null
          bl_id?: string | null
          camion_rescue?: string | null
          ceo_notified?: boolean | null
          ceo_notified_at?: string | null
          created_at?: string
          created_by?: string | null
          date_incident?: string
          description: string
          id?: string
          id_camion: string
          resolu?: boolean | null
          resolu_at?: string | null
          resolution_notes?: string | null
          type_incident: string
          volume_perdu?: number | null
        }
        Update: {
          bc_id?: string | null
          bl_id?: string | null
          camion_rescue?: string | null
          ceo_notified?: boolean | null
          ceo_notified_at?: string | null
          created_at?: string
          created_by?: string | null
          date_incident?: string
          description?: string
          id?: string
          id_camion?: string
          resolu?: boolean | null
          resolu_at?: string | null
          resolution_notes?: string | null
          type_incident?: string
          volume_perdu?: number | null
        }
        Relationships: []
      }
      inspections_securite: {
        Row: {
          actions_requises: string | null
          created_at: string
          date_inspection: string
          eclairage_ok: boolean | null
          epi_disponibles: boolean | null
          extincteurs_ok: boolean | null
          garde_corps_ok: boolean | null
          id: string
          inspecteur: string
          issues_secours_ok: boolean | null
          non_conformites_details: string | null
          non_conformites_detectees: number | null
          photos: string[] | null
          score_global: number | null
          signalisation_ok: boolean | null
          sol_propre_antiderapant: boolean | null
          stockage_produits_ok: boolean | null
          type_inspection: string
          valide: boolean
          valide_at: string | null
          valide_par: string | null
        }
        Insert: {
          actions_requises?: string | null
          created_at?: string
          date_inspection?: string
          eclairage_ok?: boolean | null
          epi_disponibles?: boolean | null
          extincteurs_ok?: boolean | null
          garde_corps_ok?: boolean | null
          id?: string
          inspecteur: string
          issues_secours_ok?: boolean | null
          non_conformites_details?: string | null
          non_conformites_detectees?: number | null
          photos?: string[] | null
          score_global?: number | null
          signalisation_ok?: boolean | null
          sol_propre_antiderapant?: boolean | null
          stockage_produits_ok?: boolean | null
          type_inspection: string
          valide?: boolean
          valide_at?: string | null
          valide_par?: string | null
        }
        Update: {
          actions_requises?: string | null
          created_at?: string
          date_inspection?: string
          eclairage_ok?: boolean | null
          epi_disponibles?: boolean | null
          extincteurs_ok?: boolean | null
          garde_corps_ok?: boolean | null
          id?: string
          inspecteur?: string
          issues_secours_ok?: boolean | null
          non_conformites_details?: string | null
          non_conformites_detectees?: number | null
          photos?: string[] | null
          score_global?: number | null
          signalisation_ok?: boolean | null
          sol_propre_antiderapant?: boolean | null
          stockage_produits_ok?: boolean | null
          type_inspection?: string
          valide?: boolean
          valide_at?: string | null
          valide_par?: string | null
        }
        Relationships: []
      }
      lignes_achat: {
        Row: {
          achat_id: string
          created_at: string
          id: string
          materiau: string
          montant_ligne: number
          prix_unitaire: number
          quantite: number
          unite: string
        }
        Insert: {
          achat_id: string
          created_at?: string
          id?: string
          materiau: string
          montant_ligne: number
          prix_unitaire: number
          quantite: number
          unite?: string
        }
        Update: {
          achat_id?: string
          created_at?: string
          id?: string
          materiau?: string
          montant_ligne?: number
          prix_unitaire?: number
          quantite?: number
          unite?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_achat_achat_id_fkey"
            columns: ["achat_id"]
            isOneToOne: false
            referencedRelation: "achats"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_compliance_alerts: {
        Row: {
          alert_type: string
          associate_id: string | null
          created_at: string
          description: string
          id: string
          is_resolved: boolean | null
          loan_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_by_name: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          associate_id?: string | null
          created_at?: string
          description: string
          id?: string
          is_resolved?: boolean | null
          loan_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_by_name?: string | null
          severity: string
          title: string
        }
        Update: {
          alert_type?: string
          associate_id?: string | null
          created_at?: string
          description?: string
          id?: string
          is_resolved?: boolean | null
          loan_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_by_name?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_compliance_alerts_associate_id_fkey"
            columns: ["associate_id"]
            isOneToOne: false
            referencedRelation: "associates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_compliance_alerts_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_compliance_alerts_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          actual_amount: number | null
          balance_after: number
          created_at: string
          days_late: number | null
          due_date: string
          id: string
          interest_portion: number
          late_fee: number | null
          loan_id: string
          notes: string | null
          paid_by: string | null
          paid_by_name: string | null
          paid_date: string | null
          payment_method: string | null
          payment_number: number
          payment_reference: string | null
          principal_portion: number
          receipt_url: string | null
          scheduled_amount: number
          status: Database["public"]["Enums"]["loan_payment_status"]
          updated_at: string
        }
        Insert: {
          actual_amount?: number | null
          balance_after: number
          created_at?: string
          days_late?: number | null
          due_date: string
          id?: string
          interest_portion?: number
          late_fee?: number | null
          loan_id: string
          notes?: string | null
          paid_by?: string | null
          paid_by_name?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_number: number
          payment_reference?: string | null
          principal_portion?: number
          receipt_url?: string | null
          scheduled_amount: number
          status?: Database["public"]["Enums"]["loan_payment_status"]
          updated_at?: string
        }
        Update: {
          actual_amount?: number | null
          balance_after?: number
          created_at?: string
          days_late?: number | null
          due_date?: string
          id?: string
          interest_portion?: number
          late_fee?: number | null
          loan_id?: string
          notes?: string | null
          paid_by?: string | null
          paid_by_name?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_number?: number
          payment_reference?: string | null
          principal_portion?: number
          receipt_url?: string | null
          scheduled_amount?: number
          status?: Database["public"]["Enums"]["loan_payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          associate_id: string
          board_decision_url: string | null
          contract_url: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          end_date: string
          id: string
          interest_rate: number | null
          loan_number: string
          loan_type: Database["public"]["Enums"]["loan_type"]
          monthly_payment: number
          notes: string | null
          principal_amount: number
          start_date: string
          status: Database["public"]["Enums"]["loan_status"]
          term_months: number
          total_amount: number
          total_interest: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          associate_id: string
          board_decision_url?: string | null
          contract_url?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          end_date: string
          id?: string
          interest_rate?: number | null
          loan_number: string
          loan_type: Database["public"]["Enums"]["loan_type"]
          monthly_payment: number
          notes?: string | null
          principal_amount: number
          start_date: string
          status?: Database["public"]["Enums"]["loan_status"]
          term_months: number
          total_amount: number
          total_interest?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          associate_id?: string
          board_decision_url?: string | null
          contract_url?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          end_date?: string
          id?: string
          interest_rate?: number | null
          loan_number?: string
          loan_type?: Database["public"]["Enums"]["loan_type"]
          monthly_payment?: number
          notes?: string | null
          principal_amount?: number
          start_date?: string
          status?: Database["public"]["Enums"]["loan_status"]
          term_months?: number
          total_amount?: number
          total_interest?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_associate_id_fkey"
            columns: ["associate_id"]
            isOneToOne: false
            referencedRelation: "associates"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          cout_main_oeuvre: number | null
          cout_pieces: number | null
          cout_total: number | null
          created_at: string
          created_by: string | null
          date_executee: string | null
          date_planifiee: string | null
          description: string
          duree_heures: number | null
          equipement_id: string
          executant_interne: string | null
          id: string
          photos_apres: string[] | null
          photos_avant: string[] | null
          pieces_utilisees: string[] | null
          prestataire_externe: string | null
          prochaine_maintenance_jours: number | null
          rapport_intervention: string | null
          statut: string
          type_maintenance: string
          updated_at: string
        }
        Insert: {
          cout_main_oeuvre?: number | null
          cout_pieces?: number | null
          cout_total?: number | null
          created_at?: string
          created_by?: string | null
          date_executee?: string | null
          date_planifiee?: string | null
          description: string
          duree_heures?: number | null
          equipement_id: string
          executant_interne?: string | null
          id?: string
          photos_apres?: string[] | null
          photos_avant?: string[] | null
          pieces_utilisees?: string[] | null
          prestataire_externe?: string | null
          prochaine_maintenance_jours?: number | null
          rapport_intervention?: string | null
          statut?: string
          type_maintenance: string
          updated_at?: string
        }
        Update: {
          cout_main_oeuvre?: number | null
          cout_pieces?: number | null
          cout_total?: number | null
          created_at?: string
          created_by?: string | null
          date_executee?: string | null
          date_planifiee?: string | null
          description?: string
          duree_heures?: number | null
          equipement_id?: string
          executant_interne?: string | null
          id?: string
          photos_apres?: string[] | null
          photos_avant?: string[] | null
          pieces_utilisees?: string[] | null
          prestataire_externe?: string | null
          prochaine_maintenance_jours?: number | null
          rapport_intervention?: string | null
          statut?: string
          type_maintenance?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          calibration_interval_days: number | null
          created_at: string
          description: string | null
          equipment_type: string
          id: string
          maintenance_interval_days: number
          updated_at: string
        }
        Insert: {
          calibration_interval_days?: number | null
          created_at?: string
          description?: string | null
          equipment_type: string
          id?: string
          maintenance_interval_days?: number
          updated_at?: string
        }
        Update: {
          calibration_interval_days?: number | null
          created_at?: string
          description?: string | null
          equipment_type?: string
          id?: string
          maintenance_interval_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      monthly_expense_caps: {
        Row: {
          cap_exceeded: boolean | null
          cap_exceeded_at: string | null
          created_at: string | null
          id: string
          level1_cap: number
          level1_spent: number
          month_year: string
          updated_at: string | null
        }
        Insert: {
          cap_exceeded?: boolean | null
          cap_exceeded_at?: string | null
          created_at?: string | null
          id?: string
          level1_cap?: number
          level1_spent?: number
          month_year: string
          updated_at?: string | null
        }
        Update: {
          cap_exceeded?: boolean | null
          cap_exceeded_at?: string | null
          created_at?: string | null
          id?: string
          level1_cap?: number
          level1_spent?: number
          month_year?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mouvements_stock: {
        Row: {
          created_at: string
          created_by: string | null
          fournisseur: string | null
          front_desk_notes: string | null
          front_desk_validated_at: string | null
          front_desk_validated_by: string | null
          front_desk_validated_by_name: string | null
          front_desk_validation_status: string | null
          gravel_grade: string | null
          humidity_test_pct: number | null
          id: string
          materiau: string
          notes: string | null
          numero_bl_fournisseur: string | null
          photo_bl_url: string | null
          quality_assessment: string | null
          quantite: number
          quantite_apres: number
          quantite_avant: number
          reason_code: string | null
          reference_id: string | null
          reference_table: string | null
          tech_approval_at: string | null
          tech_approval_by: string | null
          tech_approval_by_name: string | null
          tech_approval_notes: string | null
          tech_approval_photos: string[] | null
          tech_approval_status: string | null
          type_mouvement: string
          workflow_status: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fournisseur?: string | null
          front_desk_notes?: string | null
          front_desk_validated_at?: string | null
          front_desk_validated_by?: string | null
          front_desk_validated_by_name?: string | null
          front_desk_validation_status?: string | null
          gravel_grade?: string | null
          humidity_test_pct?: number | null
          id?: string
          materiau: string
          notes?: string | null
          numero_bl_fournisseur?: string | null
          photo_bl_url?: string | null
          quality_assessment?: string | null
          quantite: number
          quantite_apres: number
          quantite_avant: number
          reason_code?: string | null
          reference_id?: string | null
          reference_table?: string | null
          tech_approval_at?: string | null
          tech_approval_by?: string | null
          tech_approval_by_name?: string | null
          tech_approval_notes?: string | null
          tech_approval_photos?: string[] | null
          tech_approval_status?: string | null
          type_mouvement: string
          workflow_status?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fournisseur?: string | null
          front_desk_notes?: string | null
          front_desk_validated_at?: string | null
          front_desk_validated_by?: string | null
          front_desk_validated_by_name?: string | null
          front_desk_validation_status?: string | null
          gravel_grade?: string | null
          humidity_test_pct?: number | null
          id?: string
          materiau?: string
          notes?: string | null
          numero_bl_fournisseur?: string | null
          photo_bl_url?: string | null
          quality_assessment?: string | null
          quantite?: number
          quantite_apres?: number
          quantite_avant?: number
          reason_code?: string | null
          reference_id?: string | null
          reference_table?: string | null
          tech_approval_at?: string | null
          tech_approval_by?: string | null
          tech_approval_by_name?: string | null
          tech_approval_notes?: string | null
          tech_approval_photos?: string[] | null
          tech_approval_status?: string | null
          type_mouvement?: string
          workflow_status?: string | null
        }
        Relationships: []
      }
      nettoyage_quotidien: {
        Row: {
          convoyeurs_nettoyes: boolean
          convoyeurs_photo_url: string | null
          created_at: string
          date_nettoyage: string
          effectue_par: string
          goulotte_commentaire: string | null
          goulotte_heure: string | null
          goulotte_nettoyee: boolean
          goulotte_photo_url: string | null
          id: string
          malaxeur_commentaire: string | null
          malaxeur_heure: string | null
          malaxeur_nettoye: boolean
          malaxeur_photo_url: string | null
          notes_generales: string | null
          residus_ciment_enleves: boolean
          residus_commentaire: string | null
          residus_heure: string | null
          residus_photo_url: string | null
          score_proprete: number | null
          silos_inspectes: boolean
          silos_photo_url: string | null
          systeme_eau_verifie: boolean
          updated_at: string
          valide: boolean
          valide_at: string | null
          valide_par: string | null
          zone_centrale_propre: boolean
          zone_photo_url: string | null
        }
        Insert: {
          convoyeurs_nettoyes?: boolean
          convoyeurs_photo_url?: string | null
          created_at?: string
          date_nettoyage?: string
          effectue_par: string
          goulotte_commentaire?: string | null
          goulotte_heure?: string | null
          goulotte_nettoyee?: boolean
          goulotte_photo_url?: string | null
          id?: string
          malaxeur_commentaire?: string | null
          malaxeur_heure?: string | null
          malaxeur_nettoye?: boolean
          malaxeur_photo_url?: string | null
          notes_generales?: string | null
          residus_ciment_enleves?: boolean
          residus_commentaire?: string | null
          residus_heure?: string | null
          residus_photo_url?: string | null
          score_proprete?: number | null
          silos_inspectes?: boolean
          silos_photo_url?: string | null
          systeme_eau_verifie?: boolean
          updated_at?: string
          valide?: boolean
          valide_at?: string | null
          valide_par?: string | null
          zone_centrale_propre?: boolean
          zone_photo_url?: string | null
        }
        Update: {
          convoyeurs_nettoyes?: boolean
          convoyeurs_photo_url?: string | null
          created_at?: string
          date_nettoyage?: string
          effectue_par?: string
          goulotte_commentaire?: string | null
          goulotte_heure?: string | null
          goulotte_nettoyee?: boolean
          goulotte_photo_url?: string | null
          id?: string
          malaxeur_commentaire?: string | null
          malaxeur_heure?: string | null
          malaxeur_nettoye?: boolean
          malaxeur_photo_url?: string | null
          notes_generales?: string | null
          residus_ciment_enleves?: boolean
          residus_commentaire?: string | null
          residus_heure?: string | null
          residus_photo_url?: string | null
          score_proprete?: number | null
          silos_inspectes?: boolean
          silos_photo_url?: string | null
          systeme_eau_verifie?: boolean
          updated_at?: string
          valide?: boolean
          valide_at?: string | null
          valide_par?: string | null
          zone_centrale_propre?: boolean
          zone_photo_url?: string | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          action_url: string | null
          actor_name: string | null
          actor_role: string | null
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          message: string
          notification_id: string
          read_at: string | null
          recipient_role: string
          severity: string
        }
        Insert: {
          action_url?: string | null
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          message: string
          notification_id?: string
          read_at?: string | null
          recipient_role: string
          severity: string
        }
        Update: {
          action_url?: string | null
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          message?: string
          notification_id?: string
          read_at?: string | null
          recipient_role?: string
          severity?: string
        }
        Relationships: []
      }
      offline_sync_queue: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          operation: string
          record_data: Json
          record_id: string | null
          retry_count: number | null
          status: string
          synced_at: string | null
          table_name: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          operation: string
          record_data: Json
          record_id?: string | null
          retry_count?: number | null
          status?: string
          synced_at?: string | null
          table_name: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          operation?: string
          record_data?: Json
          record_id?: string | null
          retry_count?: number | null
          status?: string
          synced_at?: string | null
          table_name?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      paiements_fournisseur: {
        Row: {
          created_at: string
          created_by: string | null
          date_paiement: string
          facture_id: string
          fournisseur_id: string
          id: string
          mode_paiement: string
          montant: number
          notes: string | null
          reference_paiement: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_paiement?: string
          facture_id: string
          fournisseur_id: string
          id?: string
          mode_paiement: string
          montant: number
          notes?: string | null
          reference_paiement?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_paiement?: string
          facture_id?: string
          fournisseur_id?: string
          id?: string
          mode_paiement?: string
          montant?: number
          notes?: string | null
          reference_paiement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paiements_fournisseur_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures_fournisseur"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_fournisseur_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "contract_compliance_summary"
            referencedColumns: ["fournisseur_id"]
          },
          {
            foreignKeyName: "paiements_fournisseur_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_partiels: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_name: string | null
          date_paiement: string
          facture_id: string
          id: string
          mode_paiement: string
          montant_paye: number
          notes: string | null
          receipt_url: string | null
          reference_paiement: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          date_paiement?: string
          facture_id: string
          id?: string
          mode_paiement?: string
          montant_paye: number
          notes?: string | null
          receipt_url?: string | null
          reference_paiement?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          date_paiement?: string
          facture_id?: string
          id?: string
          mode_paiement?: string
          montant_paye?: number
          notes?: string | null
          receipt_url?: string | null
          reference_paiement?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_schedules: {
        Row: {
          amount: number
          bank_account: string | null
          created_at: string
          entity_id: string
          entity_name: string | null
          executed_by: string | null
          executed_by_name: string | null
          executed_date: string | null
          id: string
          notes: string | null
          payment_method: string | null
          reference_id: string
          reference_number: string | null
          scheduled_date: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account?: string | null
          created_at?: string
          entity_id: string
          entity_name?: string | null
          executed_by?: string | null
          executed_by_name?: string | null
          executed_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_id: string
          reference_number?: string | null
          scheduled_date: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account?: string | null
          created_at?: string
          entity_id?: string
          entity_name?: string | null
          executed_by?: string | null
          executed_by_name?: string | null
          executed_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_id?: string
          reference_number?: string | null
          scheduled_date?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      personnel_registry: {
        Row: {
          can_access_forensic_blackbox: boolean | null
          can_approve_administrative: boolean | null
          can_approve_emergency_bc: boolean | null
          can_approve_technical: boolean | null
          can_generate_bypass_tokens: boolean | null
          can_override_credit_block: boolean | null
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          monthly_cap_limit_mad: number | null
          receives_all_notifications: boolean | null
          role_code: string
          subject_to_spending_cap: boolean | null
          trust_level: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          can_access_forensic_blackbox?: boolean | null
          can_approve_administrative?: boolean | null
          can_approve_emergency_bc?: boolean | null
          can_approve_technical?: boolean | null
          can_generate_bypass_tokens?: boolean | null
          can_override_credit_block?: boolean | null
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          monthly_cap_limit_mad?: number | null
          receives_all_notifications?: boolean | null
          role_code: string
          subject_to_spending_cap?: boolean | null
          trust_level: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          can_access_forensic_blackbox?: boolean | null
          can_approve_administrative?: boolean | null
          can_approve_emergency_bc?: boolean | null
          can_approve_technical?: boolean | null
          can_generate_bypass_tokens?: boolean | null
          can_override_credit_block?: boolean | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          monthly_cap_limit_mad?: number | null
          receives_all_notifications?: boolean | null
          role_code?: string
          subject_to_spending_cap?: boolean | null
          trust_level?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pointages: {
        Row: {
          created_at: string
          date_pointage: string
          employe_id: string
          heure_entree: string | null
          heure_sortie: string | null
          id: string
          notes: string | null
          source: string
          updated_at: string
          valide: boolean
          valide_at: string | null
          valide_par: string | null
        }
        Insert: {
          created_at?: string
          date_pointage?: string
          employe_id: string
          heure_entree?: string | null
          heure_sortie?: string | null
          id?: string
          notes?: string | null
          source?: string
          updated_at?: string
          valide?: boolean
          valide_at?: string | null
          valide_par?: string | null
        }
        Update: {
          created_at?: string
          date_pointage?: string
          employe_id?: string
          heure_entree?: string | null
          heure_sortie?: string | null
          id?: string
          notes?: string | null
          source?: string
          updated_at?: string
          valide?: boolean
          valide_at?: string | null
          valide_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pointages_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      prestataires_transport: {
        Row: {
          actif: boolean
          code_prestataire: string
          contact_nom: string | null
          contact_telephone: string | null
          created_at: string
          id: string
          nom_prestataire: string
          note_service: number | null
          tarif_base_m3: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          code_prestataire: string
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string
          id?: string
          nom_prestataire: string
          note_service?: number | null
          tarif_base_m3?: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          code_prestataire?: string
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string
          id?: string
          nom_prestataire?: string
          note_service?: number | null
          tarif_base_m3?: number
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
      production_batches: {
        Row: {
          adjuvant_reel_l: number | null
          adjuvant_theo_l: number | null
          batch_number: number
          bl_id: string
          ciment_reel_kg: number
          ciment_theo_kg: number
          created_at: string | null
          eau_reel_l: number
          eau_theo_l: number
          entered_at: string | null
          entered_by: string | null
          entered_by_name: string | null
          gravette_reel_kg: number | null
          gravette_theo_kg: number | null
          has_critical_variance: boolean | null
          id: string
          notes: string | null
          photo_pupitre_url: string
          quality_status: string
          sable_reel_kg: number | null
          sable_theo_kg: number | null
          updated_at: string | null
          variance_adjuvant_pct: number | null
          variance_ciment_pct: number | null
          variance_eau_pct: number | null
          variance_gravette_pct: number | null
          variance_sable_pct: number | null
          ws7_batch_id: string | null
        }
        Insert: {
          adjuvant_reel_l?: number | null
          adjuvant_theo_l?: number | null
          batch_number?: number
          bl_id: string
          ciment_reel_kg: number
          ciment_theo_kg: number
          created_at?: string | null
          eau_reel_l: number
          eau_theo_l: number
          entered_at?: string | null
          entered_by?: string | null
          entered_by_name?: string | null
          gravette_reel_kg?: number | null
          gravette_theo_kg?: number | null
          has_critical_variance?: boolean | null
          id?: string
          notes?: string | null
          photo_pupitre_url: string
          quality_status?: string
          sable_reel_kg?: number | null
          sable_theo_kg?: number | null
          updated_at?: string | null
          variance_adjuvant_pct?: number | null
          variance_ciment_pct?: number | null
          variance_eau_pct?: number | null
          variance_gravette_pct?: number | null
          variance_sable_pct?: number | null
          ws7_batch_id?: string | null
        }
        Update: {
          adjuvant_reel_l?: number | null
          adjuvant_theo_l?: number | null
          batch_number?: number
          bl_id?: string
          ciment_reel_kg?: number
          ciment_theo_kg?: number
          created_at?: string | null
          eau_reel_l?: number
          eau_theo_l?: number
          entered_at?: string | null
          entered_by?: string | null
          entered_by_name?: string | null
          gravette_reel_kg?: number | null
          gravette_theo_kg?: number | null
          has_critical_variance?: boolean | null
          id?: string
          notes?: string | null
          photo_pupitre_url?: string
          quality_status?: string
          sable_reel_kg?: number | null
          sable_theo_kg?: number | null
          updated_at?: string | null
          variance_adjuvant_pct?: number | null
          variance_ciment_pct?: number | null
          variance_eau_pct?: number | null
          variance_gravette_pct?: number | null
          variance_sable_pct?: number | null
          ws7_batch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_batches_bl_id_fkey"
            columns: ["bl_id"]
            isOneToOne: false
            referencedRelation: "bons_livraison_reels"
            referencedColumns: ["bl_id"]
          },
          {
            foreignKeyName: "production_batches_bl_id_fkey"
            columns: ["bl_id"]
            isOneToOne: false
            referencedRelation: "client_delivery_tracking_view"
            referencedColumns: ["bl_id"]
          },
          {
            foreignKeyName: "production_batches_ws7_batch_id_fkey"
            columns: ["ws7_batch_id"]
            isOneToOne: false
            referencedRelation: "ws7_batches"
            referencedColumns: ["id"]
          },
        ]
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quote_approvals: {
        Row: {
          approval_type: string
          approved_at: string
          approved_by: string | null
          approved_by_name: string | null
          approved_by_role: string | null
          created_at: string
          discrepancies_count: number | null
          id: string
          quote_id: string
          reason: string | null
          status: string
          updated_at: string
          validation_details: Json | null
          validation_score: number | null
        }
        Insert: {
          approval_type: string
          approved_at?: string
          approved_by?: string | null
          approved_by_name?: string | null
          approved_by_role?: string | null
          created_at?: string
          discrepancies_count?: number | null
          id?: string
          quote_id: string
          reason?: string | null
          status: string
          updated_at?: string
          validation_details?: Json | null
          validation_score?: number | null
        }
        Update: {
          approval_type?: string
          approved_at?: string
          approved_by?: string | null
          approved_by_name?: string | null
          approved_by_role?: string | null
          created_at?: string
          discrepancies_count?: number | null
          id?: string
          quote_id?: string
          reason?: string | null
          status?: string
          updated_at?: string
          validation_details?: Json | null
          validation_score?: number | null
        }
        Relationships: []
      }
      rapports_journaliers: {
        Row: {
          created_at: string
          date_rapport: string
          employe_id: string
          id: string
          materiaux_utilises: Json | null
          observations: string | null
          problemes_rencontres: string | null
          soumis_at: string
          taches_completees: string
          taches_en_cours: string | null
          updated_at: string
          valide: boolean
          valide_at: string | null
          valide_par: string | null
        }
        Insert: {
          created_at?: string
          date_rapport?: string
          employe_id: string
          id?: string
          materiaux_utilises?: Json | null
          observations?: string | null
          problemes_rencontres?: string | null
          soumis_at?: string
          taches_completees: string
          taches_en_cours?: string | null
          updated_at?: string
          valide?: boolean
          valide_at?: string | null
          valide_par?: string | null
        }
        Update: {
          created_at?: string
          date_rapport?: string
          employe_id?: string
          id?: string
          materiaux_utilises?: Json | null
          observations?: string | null
          problemes_rencontres?: string | null
          soumis_at?: string
          taches_completees?: string
          taches_en_cours?: string | null
          updated_at?: string
          valide?: boolean
          valide_at?: string | null
          valide_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rapports_journaliers_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      rapprochements_bancaires: {
        Row: {
          bl_id: string | null
          client_id: string | null
          created_at: string
          ecart_montant: number | null
          facture_id: string | null
          id: string
          montant_facture: number | null
          montant_transaction: number | null
          motif_match: string | null
          score_confiance: number | null
          transaction_id: string | null
          type_match: string
          valide_at: string | null
          valide_par: string | null
        }
        Insert: {
          bl_id?: string | null
          client_id?: string | null
          created_at?: string
          ecart_montant?: number | null
          facture_id?: string | null
          id?: string
          montant_facture?: number | null
          montant_transaction?: number | null
          motif_match?: string | null
          score_confiance?: number | null
          transaction_id?: string | null
          type_match: string
          valide_at?: string | null
          valide_par?: string | null
        }
        Update: {
          bl_id?: string | null
          client_id?: string | null
          created_at?: string
          ecart_montant?: number | null
          facture_id?: string | null
          id?: string
          montant_facture?: number | null
          montant_transaction?: number | null
          motif_match?: string | null
          score_confiance?: number | null
          transaction_id?: string | null
          type_match?: string
          valide_at?: string | null
          valide_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rapprochements_bancaires_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      receivable_status: {
        Row: {
          amount: number
          bl_id: string | null
          client_id: string
          collection_stage: number | null
          created_at: string
          dispute_reason: string | null
          due_date: string
          facture_id: string | null
          id: string
          last_contact_date: string | null
          last_reminder_sent_at: string | null
          status: string
          updated_at: string
          write_off_approved_by: string | null
          write_off_reason: string | null
        }
        Insert: {
          amount: number
          bl_id?: string | null
          client_id: string
          collection_stage?: number | null
          created_at?: string
          dispute_reason?: string | null
          due_date: string
          facture_id?: string | null
          id?: string
          last_contact_date?: string | null
          last_reminder_sent_at?: string | null
          status?: string
          updated_at?: string
          write_off_approved_by?: string | null
          write_off_reason?: string | null
        }
        Update: {
          amount?: number
          bl_id?: string | null
          client_id?: string
          collection_stage?: number | null
          created_at?: string
          dispute_reason?: string | null
          due_date?: string
          facture_id?: string | null
          id?: string
          last_contact_date?: string | null
          last_reminder_sent_at?: string | null
          status?: string
          updated_at?: string
          write_off_approved_by?: string | null
          write_off_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receivable_status_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      relances_factures: {
        Row: {
          client_id: string
          created_at: string
          date_prochaine_relance: string | null
          date_relance: string
          envoyee_par: string | null
          envoyee_par_name: string | null
          facture_id: string
          id: string
          message: string | null
          niveau_relance: number
          reponse_client: string | null
          statut: string
          type_relance: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date_prochaine_relance?: string | null
          date_relance?: string
          envoyee_par?: string | null
          envoyee_par_name?: string | null
          facture_id: string
          id?: string
          message?: string | null
          niveau_relance?: number
          reponse_client?: string | null
          statut?: string
          type_relance?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date_prochaine_relance?: string | null
          date_relance?: string
          envoyee_par?: string | null
          envoyee_par_name?: string | null
          facture_id?: string
          id?: string
          message?: string | null
          niveau_relance?: number
          reponse_client?: string | null
          statut?: string
          type_relance?: string
        }
        Relationships: []
      }
      security_digest_recipients: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          frequency: string
          id: string
          is_active: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_receptions_pending: {
        Row: {
          admin_approuve_at: string | null
          admin_approuve_par: string | null
          created_at: string
          created_by: string | null
          fournisseur: string
          humidite_pct: number | null
          id: string
          materiau: string
          montant_facture: number | null
          notes_admin: string | null
          notes_qualite: string | null
          numero_bl: string
          numero_facture: string | null
          photo_bl_url: string | null
          photo_gravel_url: string | null
          photo_humidity_url: string | null
          photo_materiel_url: string | null
          poids_pesee: number | null
          qualite_approuvee_at: string | null
          qualite_approuvee_par: string | null
          qualite_visuelle: string | null
          quantite: number
          statut: string
          updated_at: string
        }
        Insert: {
          admin_approuve_at?: string | null
          admin_approuve_par?: string | null
          created_at?: string
          created_by?: string | null
          fournisseur: string
          humidite_pct?: number | null
          id?: string
          materiau: string
          montant_facture?: number | null
          notes_admin?: string | null
          notes_qualite?: string | null
          numero_bl: string
          numero_facture?: string | null
          photo_bl_url?: string | null
          photo_gravel_url?: string | null
          photo_humidity_url?: string | null
          photo_materiel_url?: string | null
          poids_pesee?: number | null
          qualite_approuvee_at?: string | null
          qualite_approuvee_par?: string | null
          qualite_visuelle?: string | null
          quantite: number
          statut?: string
          updated_at?: string
        }
        Update: {
          admin_approuve_at?: string | null
          admin_approuve_par?: string | null
          created_at?: string
          created_by?: string | null
          fournisseur?: string
          humidite_pct?: number | null
          id?: string
          materiau?: string
          montant_facture?: number | null
          notes_admin?: string | null
          notes_qualite?: string | null
          numero_bl?: string
          numero_facture?: string | null
          photo_bl_url?: string | null
          photo_gravel_url?: string | null
          photo_humidity_url?: string | null
          photo_materiel_url?: string | null
          poids_pesee?: number | null
          qualite_approuvee_at?: string | null
          qualite_approuvee_par?: string | null
          qualite_visuelle?: string | null
          quantite?: number
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      stocks: {
        Row: {
          capacite_max: number | null
          created_at: string
          derniere_modification_notes: string | null
          derniere_modification_par: string | null
          derniere_modification_type: string | null
          derniere_reception_at: string | null
          id: string
          materiau: string
          quantite_actuelle: number
          seuil_alerte: number
          unite: string
          updated_at: string
        }
        Insert: {
          capacite_max?: number | null
          created_at?: string
          derniere_modification_notes?: string | null
          derniere_modification_par?: string | null
          derniere_modification_type?: string | null
          derniere_reception_at?: string | null
          id?: string
          materiau: string
          quantite_actuelle?: number
          seuil_alerte?: number
          unite: string
          updated_at?: string
        }
        Update: {
          capacite_max?: number | null
          created_at?: string
          derniere_modification_notes?: string | null
          derniere_modification_par?: string | null
          derniere_modification_type?: string | null
          derniere_reception_at?: string | null
          id?: string
          materiau?: string
          quantite_actuelle?: number
          seuil_alerte?: number
          unite?: string
          updated_at?: string
        }
        Relationships: []
      }
      suivi_carburant: {
        Row: {
          consommation_l_100km: number | null
          cout_total_dh: number | null
          created_at: string
          created_by: string | null
          date_releve: string
          id: string
          id_camion: string
          km_compteur: number
          km_parcourus: number | null
          litres: number
          station: string | null
        }
        Insert: {
          consommation_l_100km?: number | null
          cout_total_dh?: number | null
          created_at?: string
          created_by?: string | null
          date_releve?: string
          id?: string
          id_camion: string
          km_compteur: number
          km_parcourus?: number | null
          litres: number
          station?: string | null
        }
        Update: {
          consommation_l_100km?: number | null
          cout_total_dh?: number | null
          created_at?: string
          created_by?: string | null
          date_releve?: string
          id?: string
          id_camion?: string
          km_compteur?: number
          km_parcourus?: number | null
          litres?: number
          station?: string | null
        }
        Relationships: []
      }
      supplier_cash_tracking: {
        Row: {
          fournisseur_id: string
          fournisseur_nom: string
          id: string
          last_updated_at: string | null
          limit_exceeded: boolean | null
          month_year: string
          payment_count: number
          penalty_incurred: number | null
          stamp_duty_incurred: number | null
          total_cash_amount: number
        }
        Insert: {
          fournisseur_id: string
          fournisseur_nom: string
          id?: string
          last_updated_at?: string | null
          limit_exceeded?: boolean | null
          month_year: string
          payment_count?: number
          penalty_incurred?: number | null
          stamp_duty_incurred?: number | null
          total_cash_amount?: number
        }
        Update: {
          fournisseur_id?: string
          fournisseur_nom?: string
          id?: string
          last_updated_at?: string | null
          limit_exceeded?: boolean | null
          month_year?: string
          payment_count?: number
          penalty_incurred?: number | null
          stamp_duty_incurred?: number | null
          total_cash_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_cash_tracking_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "contract_compliance_summary"
            referencedColumns: ["fournisseur_id"]
          },
          {
            foreignKeyName: "supplier_cash_tracking_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      system_errors: {
        Row: {
          action: string | null
          component: string | null
          created_at: string
          error_code: string | null
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          metadata: Json | null
          record_id: string | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          table_name: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          action?: string | null
          component?: string | null
          created_at?: string
          error_code?: string | null
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          metadata?: Json | null
          record_id?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          table_name?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string | null
          component?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          metadata?: Json | null
          record_id?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          table_name?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      tax_compliance_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          obligation_id: string | null
          read_at: string | null
          read_by: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          obligation_id?: string | null
          read_at?: string | null
          read_by?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          obligation_id?: string | null
          read_at?: string | null
          read_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_compliance_alerts_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "tax_obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_compliance_alerts_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "upcoming_tax_obligations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_obligation_templates: {
        Row: {
          auto_generate: boolean | null
          base_amount: number
          created_at: string
          description: string | null
          due_day: number
          frequency: Database["public"]["Enums"]["obligation_frequency"]
          id: string
          is_active: boolean | null
          name: string
          obligation_type: Database["public"]["Enums"]["tax_obligation_type"]
          penalty_rate: number | null
          updated_at: string
        }
        Insert: {
          auto_generate?: boolean | null
          base_amount: number
          created_at?: string
          description?: string | null
          due_day?: number
          frequency?: Database["public"]["Enums"]["obligation_frequency"]
          id?: string
          is_active?: boolean | null
          name: string
          obligation_type: Database["public"]["Enums"]["tax_obligation_type"]
          penalty_rate?: number | null
          updated_at?: string
        }
        Update: {
          auto_generate?: boolean | null
          base_amount?: number
          created_at?: string
          description?: string | null
          due_day?: number
          frequency?: Database["public"]["Enums"]["obligation_frequency"]
          id?: string
          is_active?: boolean | null
          name?: string
          obligation_type?: Database["public"]["Enums"]["tax_obligation_type"]
          penalty_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tax_obligations: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          days_overdue: number | null
          description: string | null
          due_date: string
          due_day: number
          frequency: Database["public"]["Enums"]["obligation_frequency"]
          id: string
          name: string
          notes: string | null
          obligation_type: Database["public"]["Enums"]["tax_obligation_type"]
          paid_amount: number | null
          paid_by: string | null
          paid_by_name: string | null
          paid_date: string | null
          payment_method: string | null
          payment_proof_url: string | null
          payment_reference: string | null
          penalty_amount: number | null
          period_month: number | null
          period_quarter: number | null
          period_year: number
          reminder_1_sent: boolean | null
          reminder_30_sent: boolean | null
          reminder_7_sent: boolean | null
          status: Database["public"]["Enums"]["obligation_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          days_overdue?: number | null
          description?: string | null
          due_date: string
          due_day?: number
          frequency?: Database["public"]["Enums"]["obligation_frequency"]
          id?: string
          name: string
          notes?: string | null
          obligation_type: Database["public"]["Enums"]["tax_obligation_type"]
          paid_amount?: number | null
          paid_by?: string | null
          paid_by_name?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          penalty_amount?: number | null
          period_month?: number | null
          period_quarter?: number | null
          period_year: number
          reminder_1_sent?: boolean | null
          reminder_30_sent?: boolean | null
          reminder_7_sent?: boolean | null
          status?: Database["public"]["Enums"]["obligation_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          days_overdue?: number | null
          description?: string | null
          due_date?: string
          due_day?: number
          frequency?: Database["public"]["Enums"]["obligation_frequency"]
          id?: string
          name?: string
          notes?: string | null
          obligation_type?: Database["public"]["Enums"]["tax_obligation_type"]
          paid_amount?: number | null
          paid_by?: string | null
          paid_by_name?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          penalty_amount?: number | null
          period_month?: number | null
          period_quarter?: number | null
          period_year?: number
          reminder_1_sent?: boolean | null
          reminder_30_sent?: boolean | null
          reminder_7_sent?: boolean | null
          status?: Database["public"]["Enums"]["obligation_status"]
          updated_at?: string
        }
        Relationships: []
      }
      tests_laboratoire: {
        Row: {
          affaissement_conforme: boolean | null
          affaissement_mm: number | null
          alerte_qualite: boolean | null
          bl_id: string
          created_at: string
          date_prelevement: string
          date_test_28j: string | null
          date_test_7j: string | null
          formule_id: string
          id: string
          notes: string | null
          resistance_28j_mpa: number | null
          resistance_7j_mpa: number | null
          resistance_conforme: boolean | null
          technicien_prelevement: string | null
          technicien_test: string | null
          updated_at: string
        }
        Insert: {
          affaissement_conforme?: boolean | null
          affaissement_mm?: number | null
          alerte_qualite?: boolean | null
          bl_id: string
          created_at?: string
          date_prelevement?: string
          date_test_28j?: string | null
          date_test_7j?: string | null
          formule_id: string
          id?: string
          notes?: string | null
          resistance_28j_mpa?: number | null
          resistance_7j_mpa?: number | null
          resistance_conforme?: boolean | null
          technicien_prelevement?: string | null
          technicien_test?: string | null
          updated_at?: string
        }
        Update: {
          affaissement_conforme?: boolean | null
          affaissement_mm?: number | null
          alerte_qualite?: boolean | null
          bl_id?: string
          created_at?: string
          date_prelevement?: string
          date_test_28j?: string | null
          date_test_7j?: string | null
          formule_id?: string
          id?: string
          notes?: string | null
          resistance_28j_mpa?: number | null
          resistance_7j_mpa?: number | null
          resistance_conforme?: boolean | null
          technicien_prelevement?: string | null
          technicien_test?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_laboratoire_bl_id_fkey"
            columns: ["bl_id"]
            isOneToOne: false
            referencedRelation: "bons_livraison_reels"
            referencedColumns: ["bl_id"]
          },
          {
            foreignKeyName: "tests_laboratoire_bl_id_fkey"
            columns: ["bl_id"]
            isOneToOne: false
            referencedRelation: "client_delivery_tracking_view"
            referencedColumns: ["bl_id"]
          },
        ]
      }
      tight_times_status: {
        Row: {
          activated_at: string
          activated_by: string
          activated_by_name: string | null
          affected_materials: string[] | null
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          deactivated_by_name: string | null
          duration_minutes: number
          expires_at: string
          id: string
          notes: string | null
          reason: string
          status: string
          triggered_by: Database["public"]["Enums"]["tight_times_trigger_type"]
        }
        Insert: {
          activated_at?: string
          activated_by: string
          activated_by_name?: string | null
          affected_materials?: string[] | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivated_by_name?: string | null
          duration_minutes?: number
          expires_at: string
          id?: string
          notes?: string | null
          reason: string
          status?: string
          triggered_by: Database["public"]["Enums"]["tight_times_trigger_type"]
        }
        Update: {
          activated_at?: string
          activated_by?: string
          activated_by_name?: string | null
          affected_materials?: string[] | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivated_by_name?: string | null
          duration_minutes?: number
          expires_at?: string
          id?: string
          notes?: string | null
          reason?: string
          status?: string
          triggered_by?: Database["public"]["Enums"]["tight_times_trigger_type"]
        }
        Relationships: []
      }
      user_certifications: {
        Row: {
          badge_level: string | null
          certification_type: string
          certified_at: string
          certified_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_level?: string | null
          certification_type?: string
          certified_at?: string
          certified_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_level?: string | null
          certification_type?: string
          certified_at?: string
          certified_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
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
      user_training_progress: {
        Row: {
          attempts: number | null
          best_score: number | null
          completed_at: string
          id: string
          score_conformite: number | null
          score_global: number | null
          score_precision: number | null
          score_rapidite: number | null
          step_id: string
          time_spent_seconds: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          attempts?: number | null
          best_score?: number | null
          completed_at?: string
          id?: string
          score_conformite?: number | null
          score_global?: number | null
          score_precision?: number | null
          score_rapidite?: number | null
          step_id: string
          time_spent_seconds?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          attempts?: number | null
          best_score?: number | null
          completed_at?: string
          id?: string
          score_conformite?: number | null
          score_global?: number | null
          score_precision?: number | null
          score_rapidite?: number | null
          step_id?: string
          time_spent_seconds?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      user_xp_profiles: {
        Row: {
          badges: Json | null
          created_at: string
          current_level: number | null
          id: string
          last_activity_date: string | null
          streak_days: number | null
          total_xp: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          badges?: Json | null
          created_at?: string
          current_level?: number | null
          id?: string
          last_activity_date?: string | null
          streak_days?: number | null
          total_xp?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          badges?: Json | null
          created_at?: string
          current_level?: number | null
          id?: string
          last_activity_date?: string | null
          streak_days?: number | null
          total_xp?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ws7_batches: {
        Row: {
          additives_liters: number
          batch_datetime: string
          batch_number: string
          cement_kg: number
          client_name: string
          created_at: string
          formula: string
          gravel_kg: number
          id: string
          import_datetime: string
          link_confidence: number | null
          link_status: string
          linked_bl_id: string | null
          operator_name: string | null
          raw_data: Json | null
          sand_kg: number
          total_volume_m3: number
          updated_at: string
          water_liters: number
        }
        Insert: {
          additives_liters?: number
          batch_datetime: string
          batch_number: string
          cement_kg?: number
          client_name: string
          created_at?: string
          formula: string
          gravel_kg?: number
          id?: string
          import_datetime?: string
          link_confidence?: number | null
          link_status?: string
          linked_bl_id?: string | null
          operator_name?: string | null
          raw_data?: Json | null
          sand_kg?: number
          total_volume_m3?: number
          updated_at?: string
          water_liters?: number
        }
        Update: {
          additives_liters?: number
          batch_datetime?: string
          batch_number?: string
          cement_kg?: number
          client_name?: string
          created_at?: string
          formula?: string
          gravel_kg?: number
          id?: string
          import_datetime?: string
          link_confidence?: number | null
          link_status?: string
          linked_bl_id?: string | null
          operator_name?: string | null
          raw_data?: Json | null
          sand_kg?: number
          total_volume_m3?: number
          updated_at?: string
          water_liters?: number
        }
        Relationships: [
          {
            foreignKeyName: "ws7_batches_linked_bl_id_fkey"
            columns: ["linked_bl_id"]
            isOneToOne: false
            referencedRelation: "bons_livraison_reels"
            referencedColumns: ["bl_id"]
          },
          {
            foreignKeyName: "ws7_batches_linked_bl_id_fkey"
            columns: ["linked_bl_id"]
            isOneToOne: false
            referencedRelation: "client_delivery_tracking_view"
            referencedColumns: ["bl_id"]
          },
        ]
      }
      ws7_import_log: {
        Row: {
          created_at: string
          errors: Json | null
          filename: string
          id: string
          import_datetime: string
          imported_by: string | null
          rows_failed: number
          rows_imported: number
        }
        Insert: {
          created_at?: string
          errors?: Json | null
          filename: string
          id?: string
          import_datetime?: string
          imported_by?: string | null
          rows_failed?: number
          rows_imported?: number
        }
        Update: {
          created_at?: string
          errors?: Json | null
          filename?: string
          id?: string
          import_datetime?: string
          imported_by?: string | null
          rows_failed?: number
          rows_imported?: number
        }
        Relationships: []
      }
      zones_livraison: {
        Row: {
          actif: boolean
          code_zone: string
          created_at: string
          description: string | null
          id: string
          nom_zone: string
          prix_livraison_m3: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          code_zone: string
          created_at?: string
          description?: string | null
          id?: string
          nom_zone: string
          prix_livraison_m3?: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          code_zone?: string
          created_at?: string
          description?: string | null
          id?: string
          nom_zone?: string
          prix_livraison_m3?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      client_delivery_tracking_view: {
        Row: {
          affaissement_conforme: boolean | null
          affaissement_mm: number | null
          bc_id: string | null
          bl_id: string | null
          camion_assigne: string | null
          chauffeur_nom: string | null
          client_confirmed_at: string | null
          client_confirmed_by_name: string | null
          date_livraison: string | null
          driver_phone: string | null
          heure_arrivee_chantier: string | null
          heure_depart_centrale: string | null
          heure_prevue: string | null
          nom_zone: string | null
          photo_slump_url: string | null
          photo_texture_url: string | null
          quality_approved: boolean | null
          quality_approved_by: string | null
          toupie_assignee: string | null
          tracking_token: string | null
          truck_driver: string | null
          volume_m3: number | null
          workflow_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bons_livraison_reels_camion_assigne_fkey"
            columns: ["camion_assigne"]
            isOneToOne: false
            referencedRelation: "flotte"
            referencedColumns: ["id_camion"]
          },
        ]
      }
      client_tracking_view: {
        Row: {
          adresse_livraison: string | null
          bc_confirmed_at: string | null
          bc_confirmed_by: string | null
          bc_id: string | null
          bc_statut: string | null
          bc_volume: number | null
          date_livraison_souhaitee: string | null
          formule_designation: string | null
          heure_livraison_souhaitee: string | null
          nom_client: string | null
          tracking_enabled: boolean | null
          tracking_token: string | null
          zone_nom: string | null
        }
        Relationships: []
      }
      contract_compliance_summary: {
        Row: {
          active_contracts: number | null
          annual_total: number | null
          fournisseur_actif: boolean | null
          fournisseur_id: string | null
          has_active_contract: boolean | null
          monthly_total: number | null
          nearest_expiration: string | null
          nom_fournisseur: string | null
          total_contracts: number | null
        }
        Relationships: []
      }
      department_spending_summary: {
        Row: {
          department: string | null
          expense_count: number | null
          month_year: string | null
          total_all: number | null
          total_approved: number | null
          total_paid: number | null
          total_pending: number | null
        }
        Relationships: []
      }
      loan_summary: {
        Row: {
          associate_name: string | null
          created_at: string | null
          end_date: string | null
          id: string | null
          interest_rate: number | null
          loan_number: string | null
          loan_type: Database["public"]["Enums"]["loan_type"] | null
          monthly_payment: number | null
          outstanding_balance: number | null
          payments_completed: number | null
          payments_overdue: number | null
          principal_amount: number | null
          relationship: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["loan_status"] | null
          term_months: number | null
          total_amount: number | null
          total_paid: number | null
          total_payments: number | null
        }
        Relationships: []
      }
      monthly_deposit_summary: {
        Row: {
          flagged_amount: number | null
          flagged_count: number | null
          justification_rate: number | null
          justified_amount: number | null
          justified_count: number | null
          month: string | null
          total_amount: number | null
          total_deposits: number | null
          unjustified_amount: number | null
          unjustified_count: number | null
        }
        Relationships: []
      }
      tax_compliance_summary: {
        Row: {
          obligation_type:
            | Database["public"]["Enums"]["tax_obligation_type"]
            | null
          overdue_count: number | null
          paid_count: number | null
          partial_count: number | null
          pending_count: number | null
          total_amount: number | null
          total_days_overdue: number | null
          total_obligations: number | null
          total_outstanding: number | null
          total_paid: number | null
          total_penalties: number | null
        }
        Relationships: []
      }
      upcoming_tax_obligations: {
        Row: {
          amount: number | null
          days_overdue: number | null
          days_until_due: number | null
          due_date: string | null
          id: string | null
          name: string | null
          obligation_type:
            | Database["public"]["Enums"]["tax_obligation_type"]
            | null
          penalty_amount: number | null
          status: Database["public"]["Enums"]["obligation_status"] | null
        }
        Insert: {
          amount?: number | null
          days_overdue?: number | null
          days_until_due?: never
          due_date?: string | null
          id?: string | null
          name?: string | null
          obligation_type?:
            | Database["public"]["Enums"]["tax_obligation_type"]
            | null
          penalty_amount?: number | null
          status?: Database["public"]["Enums"]["obligation_status"] | null
        }
        Update: {
          amount?: number | null
          days_overdue?: number | null
          days_until_due?: never
          due_date?: string | null
          id?: string | null
          name?: string | null
          obligation_type?:
            | Database["public"]["Enums"]["tax_obligation_type"]
            | null
          penalty_amount?: number | null
          status?: Database["public"]["Enums"]["obligation_status"] | null
        }
        Relationships: []
      }
      v_quality_feed: {
        Row: {
          camion: string | null
          client: string | null
          conforme: boolean | null
          created_at: string | null
          description: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          operateur: string | null
          photo_timestamp: string | null
          photo_url: string | null
          reference_id: string | null
          type: string | null
          valeur: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      acknowledge_emergency_notification: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      acquire_edit_lock: {
        Args: {
          p_lock_duration_minutes?: number
          p_record_id: string
          p_table_name: string
          p_user_id?: string
        }
        Returns: Json
      }
      activate_tight_times: {
        Args: {
          p_affected_materials?: string[]
          p_duration_minutes?: number
          p_notes?: string
          p_reason: string
          p_triggered_by: Database["public"]["Enums"]["tight_times_trigger_type"]
        }
        Returns: string
      }
      approve_administrative_devis: {
        Args: { p_action?: string; p_devis_id: string; p_notes?: string }
        Returns: Json
      }
      approve_devis_with_stamp: { Args: { p_devis_id: string }; Returns: Json }
      approve_stock_quality: {
        Args: {
          p_humidite_pct?: number
          p_notes?: string
          p_qualite_visuelle?: string
          p_reception_id: string
        }
        Returns: Json
      }
      approve_technical_devis: {
        Args: { p_devis_id: string; p_user_id?: string }
        Returns: Json
      }
      approve_technical_devis_v2: {
        Args: {
          p_action?: string
          p_devis_id: string
          p_discrepancies_count?: number
          p_reason?: string
          p_validation_score?: number
        }
        Returns: Json
      }
      approve_technical_reception: {
        Args: {
          p_gravel_grade?: string
          p_humidity_pct?: number
          p_mouvement_id: string
          p_notes?: string
          p_photos?: string[]
          p_quality_assessment: string
        }
        Returns: Json
      }
      calculate_cut: {
        Args: {
          p_adjuvant_l: number
          p_ciment_kg: number
          p_eau_l: number
          p_gravette_m3: number
          p_sable_m3: number
        }
        Returns: number
      }
      calculate_dpo: {
        Args: { p_fournisseur_id?: string; p_period_days?: number }
        Returns: {
          dpo_days: number
          fournisseur_id: string
          fournisseur_name: string
          total_payables: number
          total_purchases: number
        }[]
      }
      calculate_dso: {
        Args: { p_client_id?: string; p_period_days?: number }
        Returns: {
          client_id: string
          client_name: string
          dso_days: number
          total_receivables: number
          total_revenue: number
        }[]
      }
      calculate_fleet_maintenance_status: {
        Args: {
          p_date_next_visite: string
          p_km_compteur: number
          p_km_last_pneumatiques: number
          p_km_last_vidange: number
        }
        Returns: string
      }
      calculate_loan_payment: {
        Args: {
          p_annual_rate: number
          p_principal: number
          p_term_months: number
        }
        Returns: number
      }
      calculate_monthly_depreciation: {
        Args: {
          p_method?: Database["public"]["Enums"]["depreciation_method"]
          p_purchase_price: number
          p_residual_value: number
          p_useful_life_months: number
        }
        Returns: number
      }
      calculate_quote_price: {
        Args: {
          p_distance_km?: number
          p_formule_id: string
          p_volume_m3: number
        }
        Returns: {
          cut_per_m3: number
          fixed_cost_per_m3: number
          margin_pct: number
          prix_vente_minimum: number
          total_cost_per_m3: number
          total_quote: number
          transport_extra_per_m3: number
        }[]
      }
      calculate_tax_penalty: {
        Args: {
          p_amount: number
          p_due_date: string
          p_payment_date?: string
          p_penalty_rate?: number
        }
        Returns: number
      }
      calculate_water_correction: {
        Args: {
          p_densite_sable_kg_m3?: number
          p_humidite_reelle_pct: number
          p_humidite_standard_pct?: number
          p_volume_sable_m3?: number
        }
        Returns: number
      }
      can_approve_devis: { Args: { _user_id: string }; Returns: boolean }
      can_modify_bon_within_time: {
        Args: { _created_at: string }
        Returns: boolean
      }
      can_update_workflow_status: {
        Args: {
          p_current_status: string
          p_new_status: string
          p_user_id?: string
        }
        Returns: boolean
      }
      cancel_devis_approval: {
        Args: { p_devis_id: string; p_reason?: string }
        Returns: Json
      }
      check_contract_expirations: { Args: never; Returns: undefined }
      check_duplicate_asset: {
        Args: {
          p_category: Database["public"]["Enums"]["asset_category"]
          p_exclude_id?: string
          p_purchase_date: string
          p_purchase_price: number
          p_serial_number: string
          p_supplier_id: string
        }
        Returns: {
          duplicate_asset_id: string
          duplicate_id: string
          is_duplicate: boolean
          match_type: string
        }[]
      }
      check_emergency_bc_eligibility: {
        Args: { p_delivery_date: string }
        Returns: Json
      }
      check_stock_criticality: { Args: never; Returns: Json }
      consume_ceo_override: {
        Args: { p_override_type: string; p_record_id?: string; p_token: string }
        Returns: boolean
      }
      create_bl_from_bc:
        | {
            Args: {
              p_bc_id: string
              p_bl_id: string
              p_date_livraison?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_bc_id: string
              p_bl_id: string
              p_date_livraison: string
              p_volume_m3: number
            }
            Returns: string
          }
        | { Args: { p_bc_id: string; p_volume_m3?: number }; Returns: string }
      create_emergency_bc_action_items: {
        Args: {
          p_base_time?: string
          p_bc_id: string
          p_notification_id: string
        }
        Returns: {
          action_code: string
          action_name: string
          action_type: string
          assigned_to: string
          assigned_to_email: string | null
          assigned_to_phone: string | null
          assigned_to_role: string
          bc_id: string
          checklist: Json | null
          completed_at: string | null
          completed_by: string | null
          completed_by_name: string | null
          completion_notes: string | null
          created_at: string | null
          deadline_at: string | null
          deadline_minutes: number
          escalate_to: string | null
          escalate_to_email: string | null
          escalate_to_phone: string | null
          escalated: boolean | null
          escalated_at: string | null
          escalated_reason: string | null
          escalation_after_minutes: number | null
          id: string
          notification_id: string | null
          phase: number
          phase_name: string
          priority: string
          started_at: string | null
          status: string
          steps: Json | null
          success_criteria: Json | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "emergency_bc_action_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      create_emergency_bc_approval: {
        Args: {
          p_bc_id: string
          p_bc_uuid: string
          p_delivery_date: string
          p_emergency_reason: string
        }
        Returns: string
      }
      create_emergency_bc_notifications: {
        Args: { p_approval_id: string }
        Returns: {
          production_notification_id: string
          qc_notification_id: string
        }[]
      }
      create_quality_stock_entry:
        | {
            Args: {
              p_fournisseur: string
              p_humidite_pct?: number
              p_materiau: string
              p_notes?: string
              p_numero_bl: string
              p_photo_bl_url?: string
              p_photo_materiel_url: string
              p_qualite_visuelle?: string
              p_quantite: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_fournisseur: string
              p_humidite_pct?: number
              p_materiau: string
              p_notes?: string
              p_numero_bl: string
              p_photo_bl_url?: string
              p_photo_gravel_url?: string
              p_photo_humidity_url?: string
              p_photo_materiel_url: string
              p_qualite_visuelle?: string
              p_quantite: number
            }
            Returns: Json
          }
      deactivate_tight_times: { Args: never; Returns: boolean }
      detect_deposit_patterns: {
        Args: { check_date?: string }
        Returns: {
          deposit_count: number
          deposit_ids: string[]
          description: string
          pattern_type: string
          risk_level: string
          total_amount: number
        }[]
      }
      generate_asset_id: { Args: never; Returns: string }
      generate_associate_transaction_number: { Args: never; Returns: string }
      generate_ceo_bypass_token: {
        Args: {
          p_amount_limit?: number
          p_for_role: string
          p_reason: string
          p_valid_minutes?: number
        }
        Returns: {
          error: string
          expires_at: string
          success: boolean
          token_code: string
        }[]
      }
      generate_consolidated_invoice: {
        Args: { p_bc_id: string; p_facture_id: string }
        Returns: string
      }
      generate_depreciation_schedule: {
        Args: { p_asset_id: string }
        Returns: number
      }
      generate_loan_number: { Args: never; Returns: string }
      generate_production_notification_payload: {
        Args: { p_approval_id: string; p_bc_id: string; p_bc_uuid: string }
        Returns: Json
      }
      generate_qc_notification_payload: {
        Args: { p_approval_id: string; p_bc_id: string; p_bc_uuid: string }
        Returns: Json
      }
      get_active_tight_times: { Args: never; Returns: Json }
      get_approval_status: { Args: { p_devis_id: string }; Returns: Json }
      get_associate_balance: {
        Args: { p_associate_id: string }
        Returns: number
      }
      get_current_personnel: {
        Args: never
        Returns: {
          can_access_forensic_blackbox: boolean
          can_approve_administrative: boolean
          can_approve_technical: boolean
          can_generate_bypass_tokens: boolean
          display_name: string
          monthly_cap_limit_mad: number
          role_code: string
          subject_to_spending_cap: boolean
          trust_level: string
        }[]
      }
      get_department_budget_status: {
        Args: { p_month_year?: string }
        Returns: {
          alert_threshold_pct: number
          budget_cap: number
          department: string
          department_label: string
          is_alert_triggered: boolean
          is_over_budget: boolean
          remaining: number
          total_pending: number
          total_spent: number
          utilization_pct: number
        }[]
      }
      get_emergency_bc_action_items: {
        Args: { p_notification_id: string }
        Returns: {
          action_code: string
          action_name: string
          action_type: string
          assigned_to: string
          assigned_to_role: string
          checklist: Json
          completed_at: string
          completed_by_name: string
          deadline_at: string
          deadline_minutes: number
          escalate_to: string
          escalated: boolean
          escalated_at: string
          escalation_after_minutes: number
          id: string
          is_overdue: boolean
          minutes_remaining: number
          phase: number
          phase_name: string
          priority: string
          should_escalate: boolean
          started_at: string
          status: string
          steps: Json
          success_criteria: Json
        }[]
      }
      get_fixed_assets_summary: {
        Args: never
        Returns: {
          accumulated_depreciation: number
          asset_count: number
          category: Database["public"]["Enums"]["asset_category"]
          gross_value: number
          net_value: number
        }[]
      }
      get_loan_outstanding_balance: {
        Args: { p_loan_id: string }
        Returns: number
      }
      get_payables_aging_summary: {
        Args: never
        Returns: {
          bucket: string
          bucket_order: number
          invoice_count: number
          percentage: number
          total_amount: number
        }[]
      }
      get_pending_frontdesk_validations: {
        Args: never
        Returns: {
          created_at: string
          fournisseur: string
          front_desk_validation_status: string
          gravel_grade: string
          humidity_test_pct: number
          id: string
          materiau: string
          numero_bl_fournisseur: string
          photo_bl_url: string
          quality_assessment: string
          quantite: number
          tech_approval_at: string
          tech_approval_by_name: string
          tech_approval_notes: string
          tech_approval_status: string
          workflow_status: string
        }[]
      }
      get_pending_technical_approvals: {
        Args: never
        Returns: {
          created_at: string
          fournisseur: string
          id: string
          materiau: string
          numero_bl_fournisseur: string
          photo_bl_url: string
          quantite: number
          tech_approval_status: string
          workflow_status: string
        }[]
      }
      get_receivables_aging_summary: {
        Args: never
        Returns: {
          bucket: string
          bucket_order: number
          invoice_count: number
          percentage: number
          total_amount: number
        }[]
      }
      get_rls_policies_for_report: {
        Args: never
        Returns: {
          cmd: string
          permissive: string
          policyname: string
          qual: string
          roles: string
          schemaname: string
          tablename: string
          with_check: string
        }[]
      }
      get_security_functions_for_report: {
        Args: never
        Returns: {
          routine_name: string
          routine_type: string
          security_type: string
        }[]
      }
      get_user_display_info: {
        Args: { p_user_id: string }
        Returns: {
          full_name: string
          role_name: string
        }[]
      }
      get_user_role_text: { Args: { p_user_id: string }; Returns: string }
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
      is_auditeur: { Args: { user_id: string }; Returns: boolean }
      is_auditeur_v2: { Args: { _user_id: string }; Returns: boolean }
      is_centraliste: { Args: { _user_id: string }; Returns: boolean }
      is_ceo: { Args: { _user_id: string }; Returns: boolean }
      is_ceo_direct: { Args: { _user_id: string }; Returns: boolean }
      is_ceo_role: { Args: never; Returns: boolean }
      is_ceo_v2: { Args: { _user_id: string }; Returns: boolean }
      is_commercial: { Args: { _user_id: string }; Returns: boolean }
      is_directeur_operations: { Args: { _user_id: string }; Returns: boolean }
      is_finance_role: { Args: never; Returns: boolean }
      is_management_role: { Args: never; Returns: boolean }
      is_master_admin: { Args: never; Returns: boolean }
      is_operator: { Args: { _user_id: string }; Returns: boolean }
      is_responsable_technique: { Args: { _user_id: string }; Returns: boolean }
      is_superviseur: { Args: { _user_id: string }; Returns: boolean }
      is_tight_times_active: { Args: never; Returns: boolean }
      log_approval_audit: {
        Args: {
          p_action: string
          p_event_type: string
          p_new_status?: string
          p_previous_status?: string
          p_quote_id: string
          p_reason?: string
          p_security_flag?: boolean
          p_validation_details?: Json
        }
        Returns: string
      }
      log_training_completion: {
        Args: {
          p_score: number
          p_simulation_type: string
          p_user_name: string
        }
        Returns: undefined
      }
      match_deposit_to_invoice: { Args: { deposit_id: string }; Returns: Json }
      notify_ceo_critical_action: {
        Args: {
          p_actor_name: string
          p_actor_role: string
          p_details?: Json
          p_event_type: string
          p_message: string
          p_severity: string
        }
        Returns: string
      }
      process_emergency_bc_approval: {
        Args: { p_action: string; p_approval_id: string; p_notes?: string }
        Returns: boolean
      }
      release_edit_lock: {
        Args: { p_record_id: string; p_table_name: string; p_user_id?: string }
        Returns: boolean
      }
      secure_add_reception: {
        Args: {
          p_fournisseur: string
          p_materiau: string
          p_notes?: string
          p_numero_bl: string
          p_photo_bl_url?: string
          p_quantite: number
        }
        Returns: Json
      }
      secure_adjust_stock: {
        Args: {
          p_materiau: string
          p_notes: string
          p_nouvelle_quantite: number
          p_reason_code: string
        }
        Returns: Json
      }
      submit_emergency_quality_decision: {
        Args: {
          p_decision: string
          p_notes?: string
          p_notification_id: string
        }
        Returns: boolean
      }
      update_action_item_status: {
        Args: { p_action_id: string; p_notes?: string; p_status: string }
        Returns: {
          action_code: string
          action_name: string
          action_type: string
          assigned_to: string
          assigned_to_email: string | null
          assigned_to_phone: string | null
          assigned_to_role: string
          bc_id: string
          checklist: Json | null
          completed_at: string | null
          completed_by: string | null
          completed_by_name: string | null
          completion_notes: string | null
          created_at: string | null
          deadline_at: string | null
          deadline_minutes: number
          escalate_to: string | null
          escalate_to_email: string | null
          escalate_to_phone: string | null
          escalated: boolean | null
          escalated_at: string | null
          escalated_reason: string | null
          escalation_after_minutes: number | null
          id: string
          notification_id: string | null
          phase: number
          phase_name: string
          priority: string
          started_at: string | null
          status: string
          steps: Json | null
          success_criteria: Json | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "emergency_bc_action_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_asset_depreciation: { Args: never; Returns: number }
      use_ceo_bypass_token: {
        Args: { p_reference: string; p_token_code: string }
        Returns: {
          amount_limit: number
          error: string
          success: boolean
        }[]
      }
      validate_devis: {
        Args: { p_devis_id: string; p_user_id?: string }
        Returns: Json
      }
      validate_frontdesk_reception: {
        Args: {
          p_confirmed_quantity: number
          p_mouvement_id: string
          p_notes?: string
        }
        Returns: Json
      }
      validate_stock_reception: {
        Args: {
          p_notes?: string
          p_numero_facture?: string
          p_poids_pesee?: number
          p_reception_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "ceo" | "operator" | "accounting" | "commercial"
      asset_category:
        | "batiments"
        | "vehicules"
        | "equipements"
        | "mobilier"
        | "informatique"
        | "outils"
        | "autre"
      asset_status:
        | "new"
        | "active"
        | "maintenance"
        | "inactive"
        | "pending_disposal"
        | "disposed"
      cash_source_type:
        | "customer_payment"
        | "ceo_injection"
        | "refund"
        | "loan"
        | "other"
      contract_type: "camion_rental" | "trax_rental" | "terrain_rental"
      depreciation_method: "linear" | "accelerated" | "units_of_production"
      expense_approval_level: "level_1" | "level_2" | "level_3"
      expense_category:
        | "carburant"
        | "maintenance"
        | "fournitures"
        | "transport"
        | "reparation"
        | "nettoyage"
        | "petit_equipement"
        | "services_externes"
        | "frais_administratifs"
        | "autre"
      expense_status:
        | "brouillon"
        | "en_attente"
        | "approuve"
        | "rejete"
        | "bloque_plafond"
        | "paye"
      loan_payment_status: "pending" | "paid" | "late" | "partial" | "skipped"
      loan_status: "active" | "paid_off" | "defaulted" | "cancelled"
      loan_type: "to_company" | "from_company"
      obligation_frequency: "monthly" | "quarterly" | "annual" | "one_time"
      obligation_status: "pending" | "paid" | "overdue" | "partially_paid"
      tax_obligation_type:
        | "cnss"
        | "mutuelle"
        | "ir"
        | "tva"
        | "timbre"
        | "patente"
        | "taxe_professionnelle"
        | "other"
      tight_times_trigger_type:
        | "STOCK_CRITICAL"
        | "ORDER_SURGE"
        | "EQUIPMENT_BREAKDOWN"
        | "SUPPLIER_FAILURE"
        | "QUALITY_ISSUE"
        | "MANUAL"
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
      asset_category: [
        "batiments",
        "vehicules",
        "equipements",
        "mobilier",
        "informatique",
        "outils",
        "autre",
      ],
      asset_status: [
        "new",
        "active",
        "maintenance",
        "inactive",
        "pending_disposal",
        "disposed",
      ],
      cash_source_type: [
        "customer_payment",
        "ceo_injection",
        "refund",
        "loan",
        "other",
      ],
      contract_type: ["camion_rental", "trax_rental", "terrain_rental"],
      depreciation_method: ["linear", "accelerated", "units_of_production"],
      expense_approval_level: ["level_1", "level_2", "level_3"],
      expense_category: [
        "carburant",
        "maintenance",
        "fournitures",
        "transport",
        "reparation",
        "nettoyage",
        "petit_equipement",
        "services_externes",
        "frais_administratifs",
        "autre",
      ],
      expense_status: [
        "brouillon",
        "en_attente",
        "approuve",
        "rejete",
        "bloque_plafond",
        "paye",
      ],
      loan_payment_status: ["pending", "paid", "late", "partial", "skipped"],
      loan_status: ["active", "paid_off", "defaulted", "cancelled"],
      loan_type: ["to_company", "from_company"],
      obligation_frequency: ["monthly", "quarterly", "annual", "one_time"],
      obligation_status: ["pending", "paid", "overdue", "partially_paid"],
      tax_obligation_type: [
        "cnss",
        "mutuelle",
        "ir",
        "tva",
        "timbre",
        "patente",
        "taxe_professionnelle",
        "other",
      ],
      tight_times_trigger_type: [
        "STOCK_CRITICAL",
        "ORDER_SURGE",
        "EQUIPMENT_BREAKDOWN",
        "SUPPLIER_FAILURE",
        "QUALITY_ISSUE",
        "MANUAL",
      ],
    },
  },
} as const
