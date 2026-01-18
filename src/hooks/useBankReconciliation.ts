import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO } from 'date-fns';

export interface BankTransaction {
  id: string;
  date_transaction: string;
  date_valeur: string | null;
  libelle: string;
  reference_bancaire: string | null;
  montant: number;
  devise: string;
  type_transaction: string;
  statut_rapprochement: string;
  client_id_suggere: string | null;
  facture_id_suggeree: string | null;
  score_confiance: number | null;
  rapproche_par: string | null;
  rapproche_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface MatchSuggestion {
  facture_id: string | null;
  bl_id: string | null;
  client_id: string;
  client_nom: string;
  montant_facture: number;
  date_facture: string;
  score: number;
  motifs: string[];
}

export interface ReconciliationStats {
  totalTransactions: number;
  rapprochees: number;
  nonRapprochees: number;
  ignorees: number;
  montantRapproche: number;
  montantEnAttente: number;
}

interface Client {
  client_id: string;
  nom_client: string;
}

interface Facture {
  facture_id: string;
  client_id: string;
  total_ttc: number;
  date_facture: string;
  statut: string;
}

interface BonLivraison {
  bl_id: string;
  client_id: string;
  volume_m3: number;
  prix_vente_m3: number | null;
  prix_livraison_m3: number | null;
  date_livraison: string;
  statut_paiement: string;
}

export function useBankReconciliation() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [stats, setStats] = useState<ReconciliationStats>({
    totalTransactions: 0,
    rapprochees: 0,
    nonRapprochees: 0,
    ignorees: 0,
    montantRapproche: 0,
    montantEnAttente: 0,
  });
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [bons, setBons] = useState<BonLivraison[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [transactionsRes, clientsRes, facturesRes, bonsRes] = await Promise.all([
        supabase
          .from('bank_transactions')
          .select('*')
          .order('date_transaction', { ascending: false }),
        supabase
          .from('clients')
          .select('client_id, nom_client'),
        supabase
          .from('factures')
          .select('facture_id, client_id, total_ttc, date_facture, statut')
          .neq('statut', 'payee'),
        supabase
          .from('bons_livraison_reels')
          .select('bl_id, client_id, volume_m3, prix_vente_m3, prix_livraison_m3, date_livraison, statut_paiement')
          .neq('statut_paiement', 'Payé'),
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (clientsRes.error) throw clientsRes.error;

      const txns = (transactionsRes.data || []) as BankTransaction[];
      setTransactions(txns);
      setClients(clientsRes.data || []);
      setFactures(facturesRes.data || []);
      setBons(bonsRes.data || []);

      // Calculate stats
      const rapprochees = txns.filter(t => t.statut_rapprochement === 'rapproche');
      const nonRapprochees = txns.filter(t => t.statut_rapprochement === 'non_rapproche');
      const ignorees = txns.filter(t => t.statut_rapprochement === 'ignore');

      setStats({
        totalTransactions: txns.length,
        rapprochees: rapprochees.length,
        nonRapprochees: nonRapprochees.length,
        ignorees: ignorees.length,
        montantRapproche: rapprochees.reduce((sum, t) => sum + Number(t.montant), 0),
        montantEnAttente: nonRapprochees.reduce((sum, t) => sum + Number(t.montant), 0),
      });

    } catch (err) {
      console.error('Error fetching reconciliation data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Find match suggestions for a transaction
  const findMatches = useCallback((transaction: BankTransaction): MatchSuggestion[] => {
    const suggestions: MatchSuggestion[] = [];
    const txnMontant = Number(transaction.montant);
    const txnDate = parseISO(transaction.date_transaction);
    const txnLibelle = transaction.libelle.toLowerCase();

    // Check against unpaid invoices
    factures.forEach(facture => {
      const factureMontant = Number(facture.total_ttc);
      const factureDate = parseISO(facture.date_facture);
      const client = clients.find(c => c.client_id === facture.client_id);
      
      let score = 0;
      const motifs: string[] = [];

      // Exact amount match (40% weight)
      const montantDiff = Math.abs(txnMontant - factureMontant);
      const montantPct = montantDiff / factureMontant;
      if (montantPct === 0) {
        score += 0.4;
        motifs.push('Montant exact');
      } else if (montantPct < 0.01) {
        score += 0.35;
        motifs.push('Montant proche (±1%)');
      } else if (montantPct < 0.05) {
        score += 0.2;
        motifs.push('Montant similaire (±5%)');
      }

      // Client reference in libelle (35% weight)
      if (client) {
        const clientNom = client.nom_client.toLowerCase();
        const clientWords = clientNom.split(/\s+/);
        const matchedWords = clientWords.filter(word => 
          word.length > 2 && txnLibelle.includes(word)
        );
        if (matchedWords.length > 0) {
          const matchRatio = matchedWords.length / clientWords.length;
          score += 0.35 * matchRatio;
          motifs.push(`Référence client: ${matchedWords.join(', ')}`);
        }
      }

      // Invoice ID in libelle (15% weight)
      if (txnLibelle.includes(facture.facture_id.toLowerCase())) {
        score += 0.15;
        motifs.push('N° facture trouvé');
      }

      // Date proximity (10% weight)
      const daysDiff = Math.abs(differenceInDays(txnDate, factureDate));
      if (daysDiff <= 7) {
        score += 0.1;
        motifs.push('Date proche (≤7j)');
      } else if (daysDiff <= 30) {
        score += 0.05;
        motifs.push('Date proche (≤30j)');
      }

      if (score >= 0.2) {
        suggestions.push({
          facture_id: facture.facture_id,
          bl_id: null,
          client_id: facture.client_id,
          client_nom: client?.nom_client || 'Inconnu',
          montant_facture: factureMontant,
          date_facture: facture.date_facture,
          score,
          motifs,
        });
      }
    });

    // Check against unpaid BLs without invoices
    bons.forEach(bon => {
      const prixVente = Number(bon.prix_vente_m3) || 0;
      const prixLivraison = Number(bon.prix_livraison_m3) || 0;
      const bonMontant = bon.volume_m3 * (prixVente + prixLivraison) * 1.2; // Estimate TTC
      const bonDate = parseISO(bon.date_livraison);
      const client = clients.find(c => c.client_id === bon.client_id);
      
      let score = 0;
      const motifs: string[] = [];

      // Amount match
      const montantDiff = Math.abs(txnMontant - bonMontant);
      const montantPct = bonMontant > 0 ? montantDiff / bonMontant : 1;
      if (montantPct === 0) {
        score += 0.35;
        motifs.push('Montant exact (BL)');
      } else if (montantPct < 0.05) {
        score += 0.25;
        motifs.push('Montant proche BL (±5%)');
      } else if (montantPct < 0.1) {
        score += 0.15;
        motifs.push('Montant similaire BL (±10%)');
      }

      // Client reference
      if (client) {
        const clientNom = client.nom_client.toLowerCase();
        const clientWords = clientNom.split(/\s+/);
        const matchedWords = clientWords.filter(word => 
          word.length > 2 && txnLibelle.includes(word)
        );
        if (matchedWords.length > 0) {
          const matchRatio = matchedWords.length / clientWords.length;
          score += 0.3 * matchRatio;
          motifs.push(`Référence client: ${matchedWords.join(', ')}`);
        }
      }

      // BL ID in libelle
      if (txnLibelle.includes(bon.bl_id.toLowerCase())) {
        score += 0.15;
        motifs.push('N° BL trouvé');
      }

      // Date proximity
      const daysDiff = Math.abs(differenceInDays(txnDate, bonDate));
      if (daysDiff <= 14) {
        score += 0.1;
        motifs.push('Date proche (≤14j)');
      }

      if (score >= 0.2) {
        suggestions.push({
          facture_id: null,
          bl_id: bon.bl_id,
          client_id: bon.client_id,
          client_nom: client?.nom_client || 'Inconnu',
          montant_facture: bonMontant,
          date_facture: bon.date_livraison,
          score,
          motifs,
        });
      }
    });

    // Sort by score descending
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [clients, factures, bons]);

  // Import bank transactions from CSV/manual entry
  const importTransactions = useCallback(async (transactions: Omit<BankTransaction, 'id' | 'created_at' | 'statut_rapprochement' | 'rapproche_par' | 'rapproche_at' | 'score_confiance' | 'client_id_suggere' | 'facture_id_suggeree'>[]) => {
    try {
      const { data, error } = await supabase
        .from('bank_transactions')
        .insert(transactions.map(t => ({
          ...t,
          statut_rapprochement: 'non_rapproche',
        })))
        .select();

      if (error) throw error;
      await fetchData();
      return { success: true, count: data?.length || 0 };
    } catch (err) {
      console.error('Error importing transactions:', err);
      return { success: false, error: err };
    }
  }, [fetchData]);

  // Confirm a match
  const confirmMatch = useCallback(async (
    transactionId: string,
    match: MatchSuggestion,
    type: 'automatique' | 'manuel' = 'manuel'
  ) => {
    try {
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) throw new Error('Transaction not found');

      // Create reconciliation record
      const { error: recError } = await supabase
        .from('rapprochements_bancaires')
        .insert({
          transaction_id: transactionId,
          facture_id: match.facture_id,
          bl_id: match.bl_id,
          client_id: match.client_id,
          montant_facture: match.montant_facture,
          montant_transaction: transaction.montant,
          ecart_montant: Number(transaction.montant) - match.montant_facture,
          type_match: type,
          score_confiance: match.score,
          motif_match: match.motifs.join(', '),
        });

      if (recError) throw recError;

      // Update transaction status
      const { error: txnError } = await supabase
        .from('bank_transactions')
        .update({
          statut_rapprochement: 'rapproche',
          client_id_suggere: match.client_id,
          facture_id_suggeree: match.facture_id || match.bl_id,
          score_confiance: match.score,
          rapproche_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (txnError) throw txnError;

      // Mark invoice/BL as paid
      if (match.facture_id) {
        await supabase
          .from('factures')
          .update({ statut: 'payee' })
          .eq('facture_id', match.facture_id);
      }
      
      if (match.bl_id) {
        await supabase
          .from('bons_livraison_reels')
          .update({ statut_paiement: 'Payé' })
          .eq('bl_id', match.bl_id);
      }

      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error confirming match:', err);
      return { success: false, error: err };
    }
  }, [transactions, fetchData]);

  // Ignore a transaction
  const ignoreTransaction = useCallback(async (transactionId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('bank_transactions')
        .update({
          statut_rapprochement: 'ignore',
          notes: reason || 'Ignoré manuellement',
        })
        .eq('id', transactionId);

      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error ignoring transaction:', err);
      return { success: false, error: err };
    }
  }, [fetchData]);

  // Auto-reconcile high-confidence matches
  const autoReconcile = useCallback(async (minScore = 0.8) => {
    const nonRapprochees = transactions.filter(t => t.statut_rapprochement === 'non_rapproche');
    let reconciled = 0;

    for (const transaction of nonRapprochees) {
      const matches = findMatches(transaction);
      const bestMatch = matches[0];

      if (bestMatch && bestMatch.score >= minScore) {
        const result = await confirmMatch(transaction.id, bestMatch, 'automatique');
        if (result.success) reconciled++;
      }
    }

    return { reconciled };
  }, [transactions, findMatches, confirmMatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    transactions,
    stats,
    loading,
    clients,
    refetch: fetchData,
    findMatches,
    importTransactions,
    confirmMatch,
    ignoreTransaction,
    autoReconcile,
  };
}
