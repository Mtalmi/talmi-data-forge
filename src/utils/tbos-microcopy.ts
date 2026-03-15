/**
 * TBOS Micro-Copy Engine
 * Centralized personality-driven messages for the entire platform.
 * fontFamily: 'ui-monospace' throughout. Emojis sparingly — only in greetings, streaks, and tips.
 */

/* ─── GREETING BASED ON SCORE ─── */
export function getScoreGreeting(greeting: string, name: string, score: number, alertCount: number): string {
  if (score > 90) return `${greeting} ${name}. Excellente journée — votre centrale tourne comme une horloge suisse. 🎯`;
  if (score >= 80) return `${greeting} ${name}. Briefing matinal prêt. ${alertCount} alerte${alertCount !== 1 ? 's' : ''} nécessite${alertCount !== 1 ? 'nt' : ''} votre attention.`;
  if (score >= 70) return `${greeting} ${name}. Journée mitigée — quelques points d'attention nécessitent votre regard.`;
  return `${greeting} ${name}. Journée difficile — plusieurs actions critiques en attente. Commençons par les priorités.`;
}

export function getScoreStatusMessage(score: number): string {
  if (score > 90) return 'Tout est sous contrôle.';
  if (score >= 80) return 'Performance stable.';
  if (score >= 70) return 'Quelques points d\'attention.';
  return 'Attention requise.';
}

/* ─── STREAK MESSAGES ─── */
export function getStreakMessage(streak: number): string {
  if (streak >= 30) return `🔥 ${streak} jours consécutifs > 80 — record absolu! Votre équipe est au top.`;
  if (streak >= 14) return `🔥 ${streak} jours consécutifs > 80 — impressionnant!`;
  if (streak >= 7)  return `🔥 ${streak} jours consécutifs > 80 — une semaine parfaite!`;
  if (streak >= 3)  return `🔥 ${streak} jours consécutifs > 80 — bon début!`;
  return `🔥 ${streak} jours consécutifs > 80/100`;
}

export function getStreakBrokenMessage(score: number, cause?: string): string {
  return `Série interrompue (score ${score}). ${cause ? `Cause principale: ${cause}. ` : ''}Pas grave — on repart demain. 💪`;
}

/* ─── SHUTDOWN PREDICTION URGENCY ─── */
export interface ShutdownUrgency {
  headline: string;
  color: string;
  bgColor: string;
  borderColor: string;
  pulse: boolean;
  emoji: string;
}

export function getShutdownUrgency(daysUntil: number, costPerDay?: string): ShutdownUrgency {
  if (daysUntil <= 0) return {
    headline: `⛔ ARRÊT EN COURS — Stock épuisé. ${costPerDay ? `Perte estimée: ${costPerDay}/jour.` : ''}`,
    color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.08)', borderColor: '#DC2626', pulse: true, emoji: '⛔',
  };
  if (daysUntil === 1) return {
    headline: `🚨 ARRÊT DEMAIN — COMMANDE D'URGENCE NÉCESSAIRE`,
    color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.08)', borderColor: '#EF4444', pulse: true, emoji: '🚨',
  };
  if (daysUntil <= 3) return {
    headline: `🚨 ARRÊT IMMINENT DANS ${daysUntil} JOURS — ACTION REQUISE MAINTENANT`,
    color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.06)', borderColor: '#EF4444', pulse: true, emoji: '🚨',
  };
  if (daysUntil <= 7) return {
    headline: `⚠ RISQUE ARRÊT DANS ${daysUntil} JOURS`,
    color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.05)', borderColor: '#F59E0B', pulse: false, emoji: '⚠',
  };
  return {
    headline: `Approvisionnement à planifier dans les ${daysUntil} prochains jours.`,
    color: '#D4A843', bgColor: 'rgba(212, 168, 67, 0.04)', borderColor: '#D4A843', pulse: false, emoji: '📋',
  };
}

/* ─── TIME-CONTEXTUAL SUGGESTIONS ─── */
export function getTimeContextualTip(): string {
  const hour = new Date().getHours();
  if (hour < 8)  return 'Priorité du matin: vérifier les niveaux de stock et confirmer les premières livraisons.';
  if (hour < 12) return 'Production en cours. Surveillez le pic de cadence attendu entre 10h et 14h.';
  if (hour < 14) return 'Mi-journée. Bon moment pour vérifier les paiements et relancer les devis en attente.';
  if (hour < 17) return 'Après-midi. Dernières livraisons en cours. Préparer la passation du soir.';
  return 'Fin de journée. Pensez à valider la passation et vérifier le rapport du soir.';
}

/* ─── SEASONAL CONTEXTUAL TIPS ─── */
export function getSeasonalTip(market: 'mena' | 'eu' | 'us', tempC?: number): string | null {
  const month = new Date().getMonth(); // 0-indexed
  const day = new Date().getDate();

  if (market === 'mena') {
    // Ramadan window (approximate: mid-March to mid-April)
    if ((month === 2 && day >= 15) || (month === 3 && day <= 20)) {
      return 'Rappel Ramadan: Production réduite 06h-14h. Livraisons avant 12h recommandées. Hydratation équipe essentielle. 🌙';
    }
    if (tempC && tempC > 35) {
      return 'Alerte chaleur: Adjuvant retardateur systématique. Fenêtre béton réduite. Livraisons tôt le matin préférables. ☀️';
    }
  }

  if (market === 'eu') {
    if (tempC !== undefined && tempC < 5) {
      return 'Période hivernale: Vérifier antigel avant chaque batch. Temps de prise rallongé sous 5°C. ❄️';
    }
  }

  if (market === 'us') {
    // Hurricane season: June-November
    if (month >= 5 && month <= 10) {
      return 'Saison ouragans: Plan de contingence supply chain actif. Stock tampon recommandé +20%. 🌪';
    }
  }

  return null;
}

/* ─── CONTEXTUAL EMPTY STATES ─── */
export const emptyStates = {
  searchNoResults: (query: string) =>
    `Aucun résultat pour '${query}' — essayez un nom de client, un numéro de batch, ou une formule.`,
  noDeliveriesToday:
    'Aucune livraison planifiée aujourd\'hui. Jour calme — parfait pour la maintenance préventive. 🔧',
  noAlerts:
    '✓ Aucune alerte active — votre centrale fonctionne parfaitement. Continuez comme ça.',
  noNonConformities:
    '✓ 0 non-conformité aujourd\'hui — qualité exemplaire. Votre équipe lab fait un excellent travail.',
  noOverdueInvoices:
    '✓ Tous les paiements à jour — trésorerie saine.',
  emptyActivityFeed:
    'Rien à signaler pour le moment. Le prochain événement apparaîtra ici automatiquement.',
} as const;

/* ─── CONTEXTUAL SUCCESS MESSAGES ─── */
export const successMessages = {
  devisCreated: (id: string, amount: string) =>
    `✓ Devis ${id} créé — montant ${amount}. Le Deal Scorer analysera ce devis dans les prochaines minutes.`,
  testRecorded: (id: string, value: string) =>
    `✓ Test ${id} enregistré — résultat ${value}. Conformité NM vérifiée automatiquement.`,
  bonCreated: (id: string, volume: string, client: string, truck?: string) =>
    `✓ Bon ${id} créé — ${volume} pour ${client}.${truck ? ` Disponibilité toupie vérifiée: ${truck} assigné.` : ''}`,
  orderApproved: (supplier: string, date?: string) =>
    `✓ Commande approuvée — ${supplier} notifié.${date ? ` Livraison estimée: ${date}.` : ''}`,
  passationValidated:
    '✓ Passation validée — l\'équipe suivante a été notifiée. Bon shift!',
} as const;

/* ─── AI AGENT PERSONALITY PREFIXES ─── */
export const agentPersonality = {
  forensique: {
    patternFound: 'Pattern identifié.',
    investigationRecommended: 'Investigation recommandée.',
    anomalyDetected: 'Anomalie détectée.',
  },
  predicteur: {
    confidence: (pct: number) => `Confiance: ${pct}%.`,
    riskEstimate: (pct: number) => `Risque estimé à ${pct}%.`,
    prediction: (text: string) => `Prédiction: ${text}`,
  },
  optimiseur: {
    savingsPotential: (amount: string) => `Économie potentielle: +${amount}/an!`,
    roi: (months: number) => `ROI: ${months} mois.`,
    optimization: (text: string) => `Optimisation: ${text}`,
  },
  conformite: {
    certExpiring: (name: string, days: number, done: number, total: number) =>
      `Certification ${name} expire dans ${days} jours. ${done}/${total} tests effectués.`,
    compliant: 'Conforme.',
    nonCompliant: 'Non conforme — action requise.',
  },
  securite: {
    breakRecommended: 'Pause recommandée.',
    riskAfterHours: (hours: number, pct: number) =>
      `Risque accident +${pct}% après ${hours}h de conduite.`,
    safetyAlert: (text: string) => `Alerte sécurité: ${text}`,
  },
} as const;
