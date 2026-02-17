import { describe, it, expect } from 'vitest';

/**
 * E2E Integration Workflow Tests
 * 
 * These tests simulate the complete business lifecycle in isolation,
 * validating data transformations and business rules at each step:
 * 
 * Client → Devis → Bon de Commande → Bon de Livraison → Facture → Paiement
 */

// ═══════════════════════════════════════════════════════
// DOMAIN TYPES (mirrors DB schema)
// ═══════════════════════════════════════════════════════

interface Client {
  client_id: string;
  nom_entreprise: string;
  secteur_activite: string;
  credit_max: number;
  credit_used: number;
  statut: string;
}

interface Formule {
  formule_id: string;
  nom_formule: string;
  ciment_kg: number;
  sable_kg: number;
  gravier_8_15_kg: number;
  gravier_15_25_kg: number;
  eau_l: number;
  adjuvant_l: number;
  resistance_classe: string;
}

interface Devis {
  devis_id: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  prix_unitaire_ht: number;
  montant_ht: number;
  tva_pct: number;
  montant_ttc: number;
  statut: string;
  validation_technique?: boolean;
  validation_administrative?: boolean;
}

interface BonCommande {
  bc_id: string;
  client_id: string;
  formule_id: string;
  devis_id: string;
  volume_m3: number;
  prix_vente_m3: number;
  total_ht: number;
  statut: string;
  volume_livre: number;
  volume_restant: number;
}

interface BonLivraison {
  bl_id: string;
  bc_id: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  prix_vente_m3: number;
  ciment_reel_kg: number;
  date_livraison: string;
  statut_paiement: string;
  validation_technique: boolean;
  variance_ciment_pct: number;
}

interface Facture {
  facture_id: string;
  client_id: string;
  montant_ht: number;
  tva_montant: number;
  montant_ttc: number;
  statut_paiement: string;
  date_echeance: string;
  retard_jours: number;
}

// ═══════════════════════════════════════════════════════
// BUSINESS LOGIC FUNCTIONS
// ═══════════════════════════════════════════════════════

function createClient(name: string, creditMax: number): Client {
  return {
    client_id: `CLI-${Date.now()}`,
    nom_entreprise: name,
    secteur_activite: 'BTP',
    credit_max: creditMax,
    credit_used: 0,
    statut: 'actif',
  };
}

function calculateDevis(
  client: Client,
  formule: Formule,
  volume: number,
  prixM3: number,
  tvaPct = 20
): Devis {
  const montantHt = volume * prixM3;
  const montantTtc = montantHt * (1 + tvaPct / 100);
  return {
    devis_id: `DEV-${Date.now()}`,
    client_id: client.client_id,
    formule_id: formule.formule_id,
    volume_m3: volume,
    prix_unitaire_ht: prixM3,
    montant_ht: montantHt,
    tva_pct: tvaPct,
    montant_ttc: montantTtc,
    statut: 'brouillon',
  };
}

function validateTechnique(devis: Devis, formule: Formule): Devis {
  // Verify formule integrity: ciment must be 200-500 kg/m³
  if (formule.ciment_kg < 200 || formule.ciment_kg > 500) {
    throw new Error(`Ciment hors plage: ${formule.ciment_kg} kg`);
  }
  // Verify E/C ratio: 0.35 - 0.65
  const ecRatio = formule.eau_l / formule.ciment_kg;
  if (ecRatio < 0.35 || ecRatio > 0.65) {
    throw new Error(`Ratio E/C hors norme: ${ecRatio.toFixed(2)}`);
  }
  return { ...devis, validation_technique: true, statut: 'approuve_tech' };
}

function validateAdministrative(devis: Devis): Devis {
  if (!devis.validation_technique) {
    throw new Error('Validation technique requise avant validation administrative');
  }
  return { ...devis, validation_administrative: true, statut: 'approuve' };
}

function createBonCommande(devis: Devis): BonCommande {
  if (devis.statut !== 'approuve') {
    throw new Error(`Devis non approuvé: statut=${devis.statut}`);
  }
  return {
    bc_id: `BC-${Date.now()}`,
    client_id: devis.client_id,
    formule_id: devis.formule_id,
    devis_id: devis.devis_id,
    volume_m3: devis.volume_m3,
    prix_vente_m3: devis.prix_unitaire_ht,
    total_ht: devis.montant_ht,
    statut: 'en_cours',
    volume_livre: 0,
    volume_restant: devis.volume_m3,
  };
}

function createBonLivraison(
  bc: BonCommande,
  volumeLivre: number,
  cimentReelKg: number,
  formule: Formule
): { bl: BonLivraison; updatedBc: BonCommande } {
  if (volumeLivre > bc.volume_restant) {
    throw new Error(`Volume demandé (${volumeLivre}) > restant (${bc.volume_restant})`);
  }
  if (volumeLivre <= 0 || volumeLivre > 12) {
    throw new Error(`Volume livraison invalide: ${volumeLivre} (0.5-12 m³)`);
  }

  const cimentTheorique = formule.ciment_kg * volumeLivre;
  const varianceCiment = ((cimentReelKg - cimentTheorique) / cimentTheorique) * 100;

  const bl: BonLivraison = {
    bl_id: `BL-${Date.now()}`,
    bc_id: bc.bc_id,
    client_id: bc.client_id,
    formule_id: bc.formule_id,
    volume_m3: volumeLivre,
    prix_vente_m3: bc.prix_vente_m3,
    ciment_reel_kg: cimentReelKg,
    date_livraison: new Date().toISOString().split('T')[0],
    statut_paiement: 'en_attente',
    validation_technique: Math.abs(varianceCiment) <= 5,
    variance_ciment_pct: parseFloat(varianceCiment.toFixed(2)),
  };

  const updatedBc: BonCommande = {
    ...bc,
    volume_livre: bc.volume_livre + volumeLivre,
    volume_restant: bc.volume_restant - volumeLivre,
    statut: bc.volume_restant - volumeLivre <= 0 ? 'termine' : 'en_cours',
  };

  return { bl, updatedBc };
}

function generateFacture(
  bls: BonLivraison[],
  clientId: string,
  tvaPct = 20,
  echeanceJours = 30
): Facture {
  const montantHt = bls.reduce((sum, bl) => sum + bl.volume_m3 * bl.prix_vente_m3, 0);
  const tvaMontant = montantHt * (tvaPct / 100);
  const echeance = new Date();
  echeance.setDate(echeance.getDate() + echeanceJours);

  return {
    facture_id: `FAC-${Date.now()}`,
    client_id: clientId,
    montant_ht: montantHt,
    tva_montant: tvaMontant,
    montant_ttc: montantHt + tvaMontant,
    statut_paiement: 'en_attente',
    date_echeance: echeance.toISOString().split('T')[0],
    retard_jours: 0,
  };
}

function processPayment(
  facture: Facture,
  client: Client,
  montantPaye: number
): { facture: Facture; client: Client } {
  if (montantPaye < facture.montant_ttc) {
    return {
      facture: { ...facture, statut_paiement: 'partiel' },
      client: { ...client, credit_used: client.credit_used + (facture.montant_ttc - montantPaye) },
    };
  }
  return {
    facture: { ...facture, statut_paiement: 'paye', retard_jours: 0 },
    client,
  };
}

function checkCreditGate(client: Client, newOrderAmount: number): { allowed: boolean; reason?: string } {
  const projectedUsage = client.credit_used + newOrderAmount;
  if (projectedUsage > client.credit_max) {
    return { allowed: false, reason: `Crédit dépassé: ${projectedUsage} > ${client.credit_max} MAD` };
  }
  return { allowed: true };
}

// ═══════════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════════

const FORMULE_B25: Formule = {
  formule_id: 'F-B25',
  nom_formule: 'B25 S3',
  ciment_kg: 350,
  sable_kg: 800,
  gravier_8_15_kg: 400,
  gravier_15_25_kg: 600,
  eau_l: 175,
  adjuvant_l: 2.5,
  resistance_classe: 'C25/30',
};

const FORMULE_B40: Formule = {
  formule_id: 'F-B40',
  nom_formule: 'B40 S4',
  ciment_kg: 420,
  sable_kg: 750,
  gravier_8_15_kg: 450,
  gravier_15_25_kg: 550,
  eau_l: 185,
  adjuvant_l: 4.0,
  resistance_classe: 'C40/50',
};

// ═══════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════

describe('E2E Workflow - Full Lifecycle', () => {
  it('complete flow: Client → Devis → BC → BL → Facture → Paiement', () => {
    // 1. Create client
    const client = createClient('TGCC Construction', 500000);
    expect(client.statut).toBe('actif');
    expect(client.credit_used).toBe(0);

    // 2. Create devis
    const devis = calculateDevis(client, FORMULE_B25, 50, 950);
    expect(devis.montant_ht).toBe(47500);
    expect(devis.montant_ttc).toBe(57000); // +20% TVA
    expect(devis.statut).toBe('brouillon');

    // 3. Two-step handshake: technique then administrative
    const devisTech = validateTechnique(devis, FORMULE_B25);
    expect(devisTech.validation_technique).toBe(true);
    expect(devisTech.statut).toBe('approuve_tech');

    const devisApproved = validateAdministrative(devisTech);
    expect(devisApproved.validation_administrative).toBe(true);
    expect(devisApproved.statut).toBe('approuve');

    // 4. Create BC from approved devis
    const bc = createBonCommande(devisApproved);
    expect(bc.volume_m3).toBe(50);
    expect(bc.volume_restant).toBe(50);
    expect(bc.statut).toBe('en_cours');

    // 5. Deliver in batches (3 toupies of 8m³ each)
    const { bl: bl1, updatedBc: bc1 } = createBonLivraison(bc, 8, 2800, FORMULE_B25);
    expect(bl1.volume_m3).toBe(8);
    expect(bc1.volume_livre).toBe(8);
    expect(bc1.volume_restant).toBe(42);

    const { bl: bl2, updatedBc: bc2 } = createBonLivraison(bc1, 8, 2810, FORMULE_B25);
    expect(bc2.volume_livre).toBe(16);

    const { bl: bl3, updatedBc: bc3 } = createBonLivraison(bc2, 8, 2790, FORMULE_B25);
    expect(bc3.volume_livre).toBe(24);
    expect(bc3.statut).toBe('en_cours');

    // 6. Generate facture for delivered BLs
    const facture = generateFacture([bl1, bl2, bl3], client.client_id);
    expect(facture.montant_ht).toBe(22800); // 24m³ × 950 MAD
    expect(facture.montant_ttc).toBe(27360); // +20% TVA
    expect(facture.statut_paiement).toBe('en_attente');

    // 7. Full payment
    const { facture: paidFacture, client: updatedClient } = processPayment(facture, client, 27360);
    expect(paidFacture.statut_paiement).toBe('paye');
    expect(updatedClient.credit_used).toBe(0);
  });
});

describe('E2E Workflow - Two-Step Handshake Enforcement', () => {
  it('blocks administrative validation without technical approval', () => {
    const client = createClient('Addoha', 200000);
    const devis = calculateDevis(client, FORMULE_B25, 20, 900);
    
    expect(() => validateAdministrative(devis)).toThrow('Validation technique requise');
  });

  it('blocks BC creation from unapproved devis', () => {
    const client = createClient('Alliances', 300000);
    const devis = calculateDevis(client, FORMULE_B40, 30, 1200);
    const devisTech = validateTechnique(devis, FORMULE_B40);
    
    // Only tech-approved, not admin-approved
    expect(() => createBonCommande(devisTech)).toThrow('Devis non approuvé');
  });

  it('rejects invalid formule (ciment out of range)', () => {
    const client = createClient('Test', 100000);
    const devis = calculateDevis(client, FORMULE_B25, 10, 800);
    const badFormule = { ...FORMULE_B25, ciment_kg: 150 }; // Too low
    
    expect(() => validateTechnique(devis, badFormule)).toThrow('Ciment hors plage');
  });

  it('rejects invalid E/C ratio', () => {
    const client = createClient('Test', 100000);
    const devis = calculateDevis(client, FORMULE_B25, 10, 800);
    const badFormule = { ...FORMULE_B25, eau_l: 300 }; // E/C = 0.86
    
    expect(() => validateTechnique(devis, badFormule)).toThrow('Ratio E/C hors norme');
  });
});

describe('E2E Workflow - Delivery Validation', () => {
  it('detects cement variance exceeding 5%', () => {
    const client = createClient('Jet Contractors', 400000);
    const devis = calculateDevis(client, FORMULE_B25, 20, 1000);
    const approved = validateAdministrative(validateTechnique(devis, FORMULE_B25));
    const bc = createBonCommande(approved);

    // Deliver with 10% excess cement (350 * 8 = 2800, giving 3080 = +10%)
    const { bl } = createBonLivraison(bc, 8, 3080, FORMULE_B25);
    expect(bl.validation_technique).toBe(false); // >5% variance
    expect(bl.variance_ciment_pct).toBe(10);
  });

  it('accepts delivery within 5% variance', () => {
    const client = createClient('BTP Maroc', 200000);
    const devis = calculateDevis(client, FORMULE_B25, 10, 900);
    const approved = validateAdministrative(validateTechnique(devis, FORMULE_B25));
    const bc = createBonCommande(approved);

    // 350 * 6 = 2100, giving 2150 = +2.38%
    const { bl } = createBonLivraison(bc, 6, 2150, FORMULE_B25);
    expect(bl.validation_technique).toBe(true);
    expect(Math.abs(bl.variance_ciment_pct)).toBeLessThan(5);
  });

  it('blocks delivery exceeding remaining volume', () => {
    const client = createClient('Overload Corp', 100000);
    const devis = calculateDevis(client, FORMULE_B25, 10, 800);
    const approved = validateAdministrative(validateTechnique(devis, FORMULE_B25));
    const bc = createBonCommande(approved);

    expect(() => createBonLivraison(bc, 12, 4200, FORMULE_B25)).toThrow('Volume demandé');
  });

  it('blocks invalid volume (>12 m³ per toupie)', () => {
    const client = createClient('BigVol', 500000);
    const devis = calculateDevis(client, FORMULE_B25, 100, 800);
    const approved = validateAdministrative(validateTechnique(devis, FORMULE_B25));
    const bc = createBonCommande(approved);

    expect(() => createBonLivraison(bc, 13, 4550, FORMULE_B25)).toThrow('Volume livraison invalide');
  });

  it('marks BC as terminé when fully delivered', () => {
    const client = createClient('Complete SA', 200000);
    const devis = calculateDevis(client, FORMULE_B25, 8, 900);
    const approved = validateAdministrative(validateTechnique(devis, FORMULE_B25));
    const bc = createBonCommande(approved);

    const { updatedBc } = createBonLivraison(bc, 8, 2800, FORMULE_B25);
    expect(updatedBc.volume_restant).toBe(0);
    expect(updatedBc.statut).toBe('termine');
  });
});

describe('E2E Workflow - Invoicing & Payment', () => {
  it('generates correct facture from multiple BLs', () => {
    const bls: BonLivraison[] = [
      { bl_id: 'BL1', bc_id: 'BC1', client_id: 'C1', formule_id: 'F1', volume_m3: 8, prix_vente_m3: 950, ciment_reel_kg: 2800, date_livraison: '2026-02-17', statut_paiement: 'en_attente', validation_technique: true, variance_ciment_pct: 0 },
      { bl_id: 'BL2', bc_id: 'BC1', client_id: 'C1', formule_id: 'F1', volume_m3: 6, prix_vente_m3: 950, ciment_reel_kg: 2100, date_livraison: '2026-02-17', statut_paiement: 'en_attente', validation_technique: true, variance_ciment_pct: 0 },
    ];

    const facture = generateFacture(bls, 'C1');
    expect(facture.montant_ht).toBe(13300); // (8+6) × 950
    expect(facture.tva_montant).toBe(2660); // 20%
    expect(facture.montant_ttc).toBe(15960);
  });

  it('handles partial payment correctly', () => {
    const facture: Facture = {
      facture_id: 'FAC1', client_id: 'C1', montant_ht: 10000, tva_montant: 2000,
      montant_ttc: 12000, statut_paiement: 'en_attente', date_echeance: '2026-03-17', retard_jours: 0,
    };
    const client = createClient('Partial Payer', 100000);

    const { facture: updated, client: updatedClient } = processPayment(facture, client, 8000);
    expect(updated.statut_paiement).toBe('partiel');
    expect(updatedClient.credit_used).toBe(4000); // 12000 - 8000
  });
});

describe('E2E Workflow - Credit Gate', () => {
  it('allows order within credit limit', () => {
    const client: Client = { client_id: 'C1', nom_entreprise: 'Good Client', secteur_activite: 'BTP', credit_max: 100000, credit_used: 20000, statut: 'actif' };
    expect(checkCreditGate(client, 50000).allowed).toBe(true);
  });

  it('blocks order exceeding credit limit', () => {
    const client: Client = { client_id: 'C2', nom_entreprise: 'Risky Client', secteur_activite: 'BTP', credit_max: 100000, credit_used: 80000, statut: 'actif' };
    const result = checkCreditGate(client, 30000);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Crédit dépassé');
  });

  it('blocks order at exact credit limit', () => {
    const client: Client = { client_id: 'C3', nom_entreprise: 'Edge Client', secteur_activite: 'BTP', credit_max: 50000, credit_used: 50000, statut: 'actif' };
    const result = checkCreditGate(client, 1);
    expect(result.allowed).toBe(false);
  });
});

describe('E2E Workflow - Multi-Formule Order', () => {
  it('handles B25 and B40 in same order lifecycle', () => {
    const client = createClient('Multi-Formule SARL', 1000000);

    // B25 order
    const devisB25 = calculateDevis(client, FORMULE_B25, 30, 950);
    const approvedB25 = validateAdministrative(validateTechnique(devisB25, FORMULE_B25));
    const bcB25 = createBonCommande(approvedB25);

    // B40 order (higher price)
    const devisB40 = calculateDevis(client, FORMULE_B40, 20, 1400);
    const approvedB40 = validateAdministrative(validateTechnique(devisB40, FORMULE_B40));
    const bcB40 = createBonCommande(approvedB40);

    // Deliver B25
    const { bl: blB25 } = createBonLivraison(bcB25, 8, 2800, FORMULE_B25);
    // Deliver B40 (420 * 6 = 2520)
    const { bl: blB40 } = createBonLivraison(bcB40, 6, 2520, FORMULE_B40);

    // Combined facture
    const facture = generateFacture([blB25, blB40], client.client_id);
    expect(facture.montant_ht).toBe(8 * 950 + 6 * 1400); // 7600 + 8400 = 16000
    expect(facture.montant_ttc).toBe(19200); // +20%
  });
});
