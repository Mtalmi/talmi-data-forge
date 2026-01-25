// Mode Formation Types - Sandbox Training Environment

export type SimulationType = 
  // Tier 1 - Core
  | 'stock_reception' 
  | 'expense_entry' 
  | 'midnight_protocol'
  | 'create_quote'
  | 'validate_delivery'
  | 'budget_management'
  // Tier 2 - Advanced
  | 'quality_control'
  | 'fleet_predator'
  | 'production_management'
  | 'audit_compliance'
  // Tier 3 - Executive
  | 'ceo_override'
  | 'forensic_analysis'
  | 'financial_reporting'
  | 'client_management';

export type SimulationTier = 'core' | 'advanced' | 'executive';

export type SimulationDifficulty = 'easy' | 'medium' | 'hard';

export interface SimulationStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
}

export interface SimulationConfig {
  type: SimulationType;
  title: string;
  description: string;
  duration: string;
  tier: SimulationTier;
  difficulty: SimulationDifficulty;
}

export interface StockReceptionData {
  orderId: string;
  supplier: string;
  materials: {
    name: string;
    expectedQty: number;
    receivedQty: number;
    unit: string;
  }[];
  photoUploaded: boolean;
  verified: boolean;
}

export interface ExpenseEntryData {
  currentBudget: number;
  maxBudget: number;
  category: string;
  amount: number;
  description: string;
  receiptUploaded: boolean;
  isValid: boolean;
}

export interface MidnightProtocolData {
  transactionType: string;
  amount: number;
  justification: string;
  ceoOverrideReason: string;
  isApproved: boolean;
}

export interface SimulationState {
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  data: StockReceptionData | ExpenseEntryData | MidnightProtocolData;
}
