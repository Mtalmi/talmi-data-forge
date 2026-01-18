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
          notes: string | null
          pompe_requise: boolean | null
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
          notes?: string | null
          pompe_requise?: boolean | null
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
          notes?: string | null
          pompe_requise?: boolean | null
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
          prix_vente_m3: number
          statut: string
          total_cost_per_m3: number
          total_ht: number
          transport_extra_per_m3: number
          updated_at: string
          validite_jours: number
          volume_m3: number
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
          prix_vente_m3: number
          statut?: string
          total_cost_per_m3: number
          total_ht: number
          transport_extra_per_m3?: number
          updated_at?: string
          validite_jours?: number
          volume_m3: number
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
          prix_vente_m3?: number
          statut?: string
          total_cost_per_m3?: number
          total_ht?: number
          transport_extra_per_m3?: number
          updated_at?: string
          validite_jours?: number
          volume_m3?: number
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
