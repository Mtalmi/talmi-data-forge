// ═══════════════════════════════════════════════════════
// TBOS — Demo Plant Data
// All text in French. All values in METRIC units (raw).
// Currency stored as raw numbers — display layer formats.
// ═══════════════════════════════════════════════════════

export interface PlantClient {
  name: string;
  ca: number;
  score: number;
  risk: boolean;
}

export interface PlantTruck {
  id: string;
  driver: string;
  health: number;
  status: "en-route" | "livre" | "maintenance" | "planifie";
  revenuJour: number;
}

export interface PlantFormule {
  id: string;
  resistance: number;
  classe: string;
  psi: string;
}

export interface PlantNorm {
  code: string;
  desc: string;
  status: "conforme" | "urgent" | "a-obtenir";
  daysLeft?: number;
}

export interface PlantData {
  id: string;
  company: string;
  location: string;
  currency: string;
  currencyRate: number;
  isLive: boolean;
  isDemo: boolean;
  score: number;
  streak: number;
  recordScore: number;
  weather: { temp: number; condition: string; humidity: number };
  production: { volume: number; batches: number; conformite: number; marge: number; cadence: number };
  revenue: { today: number; trend: number };
  tresorerie: { value: number; trend: number };
  profitNet: { total: number; revenu: number; matieres: number; logistique: number; personnel: number; marge: number };
  pipeline: { value: number; devis: number; conversion: number };
  clients: PlantClient[];
  riskClient: { name: string; amount: number; defaultProb: number; score: number };
  trucks: PlantTruck[];
  formules: PlantFormule[];
  norms: PlantNorm[];
  shutdownRisk: {
    active: boolean;
    daysUntil: number;
    material: string;
    currentStock: string;
    needed: string;
    deficit: string;
    costPerDay: number;
    supplier: string;
    orderQty: string;
    orderDelay: string;
    orderCost: number;
  };
  seasonal: { event: string; start: string; end: string; impact: string };
}

export const ATLAS_CONCRETE: PlantData = {
  id: "atlas",
  company: "Atlas Concrete Morocco",
  location: "Casablanca, Maroc",
  currency: "DH",
  currencyRate: 1,
  isLive: true,
  isDemo: false,
  score: 87,
  streak: 12,
  recordScore: 94,
  weather: { temp: 22, condition: "Ensoleillé", humidity: 41 },
  production: { volume: 671, batches: 14, conformite: 96.8, marge: 49.9, cadence: 47 },
  revenue: { today: 75600, trend: 8.2 },
  tresorerie: { value: 551000, trend: 9.7 },
  profitNet: { total: 24200, revenu: 75600, matieres: 37800, logistique: 5200, personnel: 8400, marge: 32 },
  pipeline: { value: 155000, devis: 6, conversion: 17 },
  clients: [
    { name: "TGCC", ca: 420000, score: 92, risk: false },
    { name: "Constructions Modernes SA", ca: 250000, score: 85, risk: false },
    { name: "BTP Maroc SARL", ca: 180000, score: 65, risk: false },
    { name: "Saudi Readymix Co.", ca: 150000, score: 74, risk: false },
    { name: "Ciments & Béton du Sud", ca: 120000, score: 74, risk: false },
    { name: "Sigma Bâtiment", ca: 50000, score: 23, risk: true },
  ],
  riskClient: { name: "Sigma Bâtiment", amount: 189000, defaultProb: 78, score: 23 },
  trucks: [
    { id: "T-04", driver: "Youssef Benali", health: 92, status: "en-route", revenuJour: 18200 },
    { id: "T-07", driver: "Karim Idrissi", health: 74, status: "livre", revenuJour: 12460 },
    { id: "T-09", driver: "—", health: 58, status: "maintenance", revenuJour: 0 },
    { id: "T-12", driver: "Mehdi Tazi", health: 86, status: "planifie", revenuJour: 8300 },
  ],
  formules: [
    { id: "F-B20", resistance: 20, classe: "C20/25", psi: "2500 PSI" },
    { id: "F-B25", resistance: 25, classe: "C25/30", psi: "3500 PSI" },
    { id: "F-B30", resistance: 30, classe: "C30/37", psi: "4500 PSI" },
    { id: "F-B35", resistance: 35, classe: "C35/45", psi: "5000 PSI" },
  ],
  norms: [
    { code: "NM 10.1.008", desc: "Béton — Spécification", status: "conforme" },
    { code: "NM 10.1.271", desc: "Essais affaissement", status: "urgent", daysLeft: 26 },
  ],
  shutdownRisk: {
    active: true,
    daysUntil: 4,
    material: "Adjuvant",
    currentStock: "200 L",
    needed: "380 L",
    deficit: "180 L",
    costPerDay: 85000,
    supplier: "Sika Maroc",
    orderQty: "500 L",
    orderDelay: "2-3 jours",
    orderCost: 42500,
  },
  seasonal: { event: "Ramadan", start: "21 mars", end: "19 avril", impact: "−30% production, horaires 06h-14h" },
};

export const EUROBETON_GMBH: PlantData = {
  id: "eurobeton",
  company: "EuroBeton GmbH",
  location: "München, Deutschland",
  currency: "EUR",
  currencyRate: 0.092,
  isLive: false,
  isDemo: true,
  score: 91,
  streak: 18,
  recordScore: 97,
  weather: { temp: 8, condition: "Couvert", humidity: 62 },
  production: { volume: 940, batches: 19, conformite: 98.2, marge: 42.3, cadence: 62 },
  revenue: { today: 128000, trend: 5.1 },
  tresorerie: { value: 2400000, trend: 3.2 },
  profitNet: { total: 48800, revenu: 128000, matieres: 51200, logistique: 12800, personnel: 15200, marge: 38.1 },
  pipeline: { value: 840000, devis: 12, conversion: 24 },
  clients: [
    { name: "Hochtief AG", ca: 1200000, score: 96, risk: false },
    { name: "STRABAG SE", ca: 980000, score: 93, risk: false },
    { name: "Vinci Construction DE", ca: 640000, score: 88, risk: false },
    { name: "Bouygues Bâtiment DE", ca: 520000, score: 85, risk: false },
    { name: "HeidelbergCement", ca: 380000, score: 91, risk: false },
    { name: "Porr Group", ca: 85000, score: 34, risk: true },
  ],
  riskClient: { name: "Porr Group", amount: 62000, defaultProb: 45, score: 34 },
  trucks: [
    { id: "LKW-01", driver: "Hans Müller", health: 94, status: "en-route", revenuJour: 38200 },
    { id: "LKW-02", driver: "Stefan Weber", health: 88, status: "livre", revenuJour: 31800 },
    { id: "LKW-03", driver: "Klaus Fischer", health: 91, status: "en-route", revenuJour: 33400 },
    { id: "LKW-04", driver: "Thomas Schmidt", health: 72, status: "planifie", revenuJour: 0 },
  ],
  formules: [
    { id: "C20/25", resistance: 20, classe: "C20/25", psi: "2500 PSI" },
    { id: "C25/30", resistance: 25, classe: "C25/30", psi: "3500 PSI" },
    { id: "C30/37", resistance: 30, classe: "C30/37", psi: "4500 PSI" },
    { id: "C35/45", resistance: 35, classe: "C35/45", psi: "5000 PSI" },
  ],
  norms: [
    { code: "EN 206-1", desc: "Béton — Spécification", status: "conforme" },
    { code: "EN 12350", desc: "Essais béton frais", status: "conforme" },
    { code: "CE Marking", desc: "Marquage conformité", status: "conforme" },
  ],
  shutdownRisk: {
    active: true,
    daysUntil: 6,
    material: "Additif antigel",
    currentStock: "150 L",
    needed: "280 L",
    deficit: "130 L",
    costPerDay: 12000,
    supplier: "BASF Construction Chemicals",
    orderQty: "300 L",
    orderDelay: "3-4 jours",
    orderCost: 8400,
  },
  seasonal: { event: "Construction hivernale", start: "Décembre", end: "Février", impact: "Additif antigel obligatoire sous 5°C" },
};

export const LIBERTY_READYMIX: PlantData = {
  id: "liberty",
  company: "Liberty Ready-Mix Inc.",
  location: "Houston, TX, USA",
  currency: "USD",
  currencyRate: 0.099,
  isLive: false,
  isDemo: true,
  score: 84,
  streak: 8,
  recordScore: 92,
  weather: { temp: 33, condition: "Humide", humidity: 78 },
  production: { volume: 670, batches: 16, conformite: 95.4, marge: 46.2, cadence: 52 },
  revenue: { today: 142000, trend: 11.3 },
  tresorerie: { value: 1840000, trend: 6.8 },
  profitNet: { total: 52200, revenu: 142000, matieres: 56800, logistique: 15600, personnel: 17400, marge: 36.8 },
  pipeline: { value: 680000, devis: 9, conversion: 22 },
  clients: [
    { name: "Turner Construction", ca: 1420000, score: 94, risk: false },
    { name: "Bechtel Corp", ca: 1080000, score: 91, risk: false },
    { name: "Kiewit Infrastructure", ca: 720000, score: 87, risk: false },
    { name: "McCarthy Building", ca: 480000, score: 83, risk: false },
    { name: "Webcor Builders", ca: 320000, score: 78, risk: false },
    { name: "Smith & Sons Contractors", ca: 95000, score: 31, risk: true },
  ],
  riskClient: { name: "Smith & Sons Contractors", amount: 84000, defaultProb: 62, score: 31 },
  trucks: [
    { id: "TRK-01", driver: "James Wilson", health: 90, status: "en-route", revenuJour: 42200 },
    { id: "TRK-02", driver: "Robert Johnson", health: 85, status: "livre", revenuJour: 38400 },
    { id: "TRK-03", driver: "Michael Davis", health: 78, status: "en-route", revenuJour: 35600 },
    { id: "TRK-04", driver: "William Brown", health: 68, status: "maintenance", revenuJour: 0 },
  ],
  formules: [
    { id: "2500 PSI", resistance: 20, classe: "C20/25", psi: "2500 PSI" },
    { id: "3500 PSI", resistance: 25, classe: "C25/30", psi: "3500 PSI" },
    { id: "4500 PSI", resistance: 30, classe: "C30/37", psi: "4500 PSI" },
    { id: "5000 PSI", resistance: 35, classe: "C35/45", psi: "5000 PSI" },
  ],
  norms: [
    { code: "ASTM C94", desc: "Ready-mixed concrete", status: "a-obtenir" },
    { code: "ACI 318", desc: "Structural concrete code", status: "a-obtenir" },
    { code: "TxDOT Spec", desc: "Texas DOT specification", status: "a-obtenir" },
  ],
  shutdownRisk: {
    active: true,
    daysUntil: 5,
    material: "Cendres volantes",
    currentStock: "12 tonnes",
    needed: "22 tonnes",
    deficit: "10 tonnes",
    costPerDay: 15000,
    supplier: "Headwaters Inc.",
    orderQty: "15 tonnes",
    orderDelay: "4-5 jours",
    orderCost: 12600,
  },
  seasonal: { event: "Saison ouragans", start: "Juin", end: "Novembre", impact: "Risque disruption chaîne d'approvisionnement, plan de contingence actif" },
};

export const ALL_PLANTS: PlantData[] = [ATLAS_CONCRETE, EUROBETON_GMBH, LIBERTY_READYMIX];
