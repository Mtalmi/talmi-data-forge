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
          id: string
          lu: boolean | null
          lu_at: string | null
          lu_par: string | null
          message: string
          niveau: string
          reference_id: string | null
          reference_table: string | null
          titre: string
          type_alerte: string
        }
        Insert: {
          created_at?: string | null
          destinataire_role?: string | null
          dismissible?: boolean | null
          id?: string
          lu?: boolean | null
          lu_at?: string | null
          lu_par?: string | null
          message: string
          niveau: string
          reference_id?: string | null
          reference_table?: string | null
          titre: string
          type_alerte: string
        }
        Update: {
          created_at?: string | null
          destinataire_role?: string | null
          dismissible?: boolean | null
          id?: string
          lu?: boolean | null
          lu_at?: string | null
          lu_par?: string | null
          message?: string
          niveau?: string
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
          client_id: string
          conditions_acces: string | null
          contact_chantier: string | null
          created_at: string
          created_by: string | null
          date_livraison_souhaitee: string | null
          devis_id: string | null
          formule_id: string
          heure_livraison_souhaitee: string | null
          id: string
          mode_paiement: string | null
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
          type_pompe: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          volume_m3: number
          zone_livraison_id: string | null
        }
        Insert: {
          adresse_livraison?: string | null
          bc_id: string
          client_id: string
          conditions_acces?: string | null
          contact_chantier?: string | null
          created_at?: string
          created_by?: string | null
          date_livraison_souhaitee?: string | null
          devis_id?: string | null
          formule_id: string
          heure_livraison_souhaitee?: string | null
          id?: string
          mode_paiement?: string | null
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
          type_pompe?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          volume_m3: number
          zone_livraison_id?: string | null
        }
        Update: {
          adresse_livraison?: string | null
          bc_id?: string
          client_id?: string
          conditions_acces?: string | null
          contact_chantier?: string | null
          created_at?: string
          created_by?: string | null
          date_livraison_souhaitee?: string | null
          devis_id?: string | null
          formule_id?: string
          heure_livraison_souhaitee?: string | null
          id?: string
          mode_paiement?: string | null
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
          type_pompe?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          volume_m3?: number
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
          bl_id: string
          camion_assigne: string | null
          chauffeur_nom: string | null
          ciment_reel_kg: number
          client_id: string
          created_at: string
          created_by: string | null
          cur_reel: number | null
          date_livraison: string
          eau_reel_l: number | null
          ecart_marge: number | null
          facture_generee: boolean | null
          facture_id: string | null
          facturer_attente: boolean | null
          formule_id: string
          heure_arrivee_chantier: string | null
          heure_depart_centrale: string | null
          heure_depart_prevue: string | null
          heure_depart_reelle: string | null
          heure_prevue: string | null
          heure_retour_centrale: string | null
          justification_ecart: string | null
          km_parcourus: number | null
          machine_id: string | null
          marge_brute_pct: number | null
          mode_paiement: string | null
          prestataire_id: string | null
          prix_livraison_m3: number | null
          prix_vente_m3: number | null
          raison_annulation: string | null
          source_donnees: string | null
          statut_paiement: string
          temps_attente_chantier_minutes: number | null
          temps_attente_site: number | null
          temps_mission_heures: number | null
          temps_rotation_minutes: number | null
          toupie_assignee: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_technique: boolean | null
          volume_m3: number
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
          bl_id: string
          camion_assigne?: string | null
          chauffeur_nom?: string | null
          ciment_reel_kg: number
          client_id: string
          created_at?: string
          created_by?: string | null
          cur_reel?: number | null
          date_livraison?: string
          eau_reel_l?: number | null
          ecart_marge?: number | null
          facture_generee?: boolean | null
          facture_id?: string | null
          facturer_attente?: boolean | null
          formule_id: string
          heure_arrivee_chantier?: string | null
          heure_depart_centrale?: string | null
          heure_depart_prevue?: string | null
          heure_depart_reelle?: string | null
          heure_prevue?: string | null
          heure_retour_centrale?: string | null
          justification_ecart?: string | null
          km_parcourus?: number | null
          machine_id?: string | null
          marge_brute_pct?: number | null
          mode_paiement?: string | null
          prestataire_id?: string | null
          prix_livraison_m3?: number | null
          prix_vente_m3?: number | null
          raison_annulation?: string | null
          source_donnees?: string | null
          statut_paiement?: string
          temps_attente_chantier_minutes?: number | null
          temps_attente_site?: number | null
          temps_mission_heures?: number | null
          temps_rotation_minutes?: number | null
          toupie_assignee?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_technique?: boolean | null
          volume_m3: number
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
          bl_id?: string
          camion_assigne?: string | null
          chauffeur_nom?: string | null
          ciment_reel_kg?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          cur_reel?: number | null
          date_livraison?: string
          eau_reel_l?: number | null
          ecart_marge?: number | null
          facture_generee?: boolean | null
          facture_id?: string | null
          facturer_attente?: boolean | null
          formule_id?: string
          heure_arrivee_chantier?: string | null
          heure_depart_centrale?: string | null
          heure_depart_prevue?: string | null
          heure_depart_reelle?: string | null
          heure_prevue?: string | null
          heure_retour_centrale?: string | null
          justification_ecart?: string | null
          km_parcourus?: number | null
          machine_id?: string | null
          marge_brute_pct?: number | null
          mode_paiement?: string | null
          prestataire_id?: string | null
          prix_livraison_m3?: number | null
          prix_vente_m3?: number | null
          raison_annulation?: string | null
          source_donnees?: string | null
          statut_paiement?: string
          temps_attente_chantier_minutes?: number | null
          temps_attente_site?: number | null
          temps_mission_heures?: number | null
          temps_rotation_minutes?: number | null
          toupie_assignee?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_technique?: boolean | null
          volume_m3?: number
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
      clients: {
        Row: {
          adresse: string | null
          client_id: string
          contact_personne: string | null
          created_at: string
          credit_bloque: boolean | null
          delai_paiement_jours: number | null
          derniere_commande_at: string | null
          email: string | null
          limite_credit_dh: number | null
          nom_client: string
          solde_du: number | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          client_id: string
          contact_personne?: string | null
          created_at?: string
          credit_bloque?: boolean | null
          delai_paiement_jours?: number | null
          derniere_commande_at?: string | null
          email?: string | null
          limite_credit_dh?: number | null
          nom_client: string
          solde_du?: number | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          client_id?: string
          contact_personne?: string | null
          created_at?: string
          credit_bloque?: boolean | null
          delai_paiement_jours?: number | null
          derniere_commande_at?: string | null
          email?: string | null
          limite_credit_dh?: number | null
          nom_client?: string
          solde_du?: number | null
          telephone?: string | null
          updated_at?: string
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
      devis: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          cut_per_m3: number
          date_expiration: string | null
          devis_id: string
          distance_km: number
          fixed_cost_per_m3: number
          formule_id: string
          id: string
          margin_pct: number
          notes: string | null
          prix_livraison_m3: number | null
          prix_vente_m3: number
          statut: string
          total_cost_per_m3: number
          total_ht: number
          transport_extra_per_m3: number
          updated_at: string
          validite_jours: number
          volume_m3: number
          zone_livraison_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          cut_per_m3: number
          date_expiration?: string | null
          devis_id: string
          distance_km?: number
          fixed_cost_per_m3?: number
          formule_id: string
          id?: string
          margin_pct?: number
          notes?: string | null
          prix_livraison_m3?: number | null
          prix_vente_m3: number
          statut?: string
          total_cost_per_m3: number
          total_ht: number
          transport_extra_per_m3?: number
          updated_at?: string
          validite_jours?: number
          volume_m3: number
          zone_livraison_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          cut_per_m3?: number
          date_expiration?: string | null
          devis_id?: string
          distance_km?: number
          fixed_cost_per_m3?: number
          formule_id?: string
          id?: string
          margin_pct?: number
          notes?: string | null
          prix_livraison_m3?: number | null
          prix_vente_m3?: number
          statut?: string
          total_cost_per_m3?: number
          total_ht?: number
          transport_extra_per_m3?: number
          updated_at?: string
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
      factures: {
        Row: {
          bl_id: string
          client_id: string
          created_at: string
          created_by: string | null
          cur_reel: number | null
          date_facture: string
          facture_id: string
          formule_id: string
          id: string
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
          bl_id: string
          client_id: string
          created_at?: string
          created_by?: string | null
          cur_reel?: number | null
          date_facture?: string
          facture_id: string
          formule_id: string
          id?: string
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
          bl_id?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          cur_reel?: number | null
          date_facture?: string
          facture_id?: string
          formule_id?: string
          id?: string
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
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      flotte: {
        Row: {
          capacite_m3: number | null
          chauffeur: string | null
          created_at: string
          derniere_maintenance_at: string | null
          id: string
          id_camion: string
          immatriculation: string | null
          is_interne: boolean
          km_compteur: number | null
          notes: string | null
          prochaine_maintenance_at: string | null
          proprietaire: string
          statut: string
          telephone_chauffeur: string | null
          type: string
          updated_at: string
        }
        Insert: {
          capacite_m3?: number | null
          chauffeur?: string | null
          created_at?: string
          derniere_maintenance_at?: string | null
          id?: string
          id_camion: string
          immatriculation?: string | null
          is_interne?: boolean
          km_compteur?: number | null
          notes?: string | null
          prochaine_maintenance_at?: string | null
          proprietaire?: string
          statut?: string
          telephone_chauffeur?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          capacite_m3?: number | null
          chauffeur?: string | null
          created_at?: string
          derniere_maintenance_at?: string | null
          id?: string
          id_camion?: string
          immatriculation?: string | null
          is_interne?: boolean
          km_compteur?: number | null
          notes?: string | null
          prochaine_maintenance_at?: string | null
          proprietaire?: string
          statut?: string
          telephone_chauffeur?: string | null
          type?: string
          updated_at?: string
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
          code_fournisseur: string
          conditions_paiement: string | null
          contact_email: string | null
          contact_nom: string | null
          contact_telephone: string | null
          created_at: string
          delai_livraison_jours: number | null
          id: string
          nom_fournisseur: string
          note_qualite: number | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          actif?: boolean | null
          adresse?: string | null
          code_fournisseur: string
          conditions_paiement?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string
          delai_livraison_jours?: number | null
          id?: string
          nom_fournisseur: string
          note_qualite?: number | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          actif?: boolean | null
          adresse?: string | null
          code_fournisseur?: string
          conditions_paiement?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string
          delai_livraison_jours?: number | null
          id?: string
          nom_fournisseur?: string
          note_qualite?: number | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
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
        }
        Insert: {
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
        }
        Update: {
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
      mouvements_stock: {
        Row: {
          created_at: string
          created_by: string | null
          fournisseur: string | null
          id: string
          materiau: string
          notes: string | null
          numero_bl_fournisseur: string | null
          quantite: number
          quantite_apres: number
          quantite_avant: number
          reference_id: string | null
          reference_table: string | null
          type_mouvement: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fournisseur?: string | null
          id?: string
          materiau: string
          notes?: string | null
          numero_bl_fournisseur?: string | null
          quantite: number
          quantite_apres: number
          quantite_avant: number
          reference_id?: string | null
          reference_table?: string | null
          type_mouvement: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fournisseur?: string | null
          id?: string
          materiau?: string
          notes?: string | null
          numero_bl_fournisseur?: string | null
          quantite?: number
          quantite_apres?: number
          quantite_avant?: number
          reference_id?: string | null
          reference_table?: string | null
          type_mouvement?: string
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
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
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
      stocks: {
        Row: {
          capacite_max: number | null
          created_at: string
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
        ]
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
      [_ in never]: never
    }
    Functions: {
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
      can_modify_bon_within_time: {
        Args: { _created_at: string }
        Returns: boolean
      }
      create_bl_from_bc: {
        Args: { p_bc_id: string; p_bl_id: string; p_date_livraison?: string }
        Returns: string
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
      is_ceo_direct: { Args: { _user_id: string }; Returns: boolean }
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
