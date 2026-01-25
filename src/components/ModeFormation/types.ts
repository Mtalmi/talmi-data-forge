// Mode Formation Types - Sandbox Training Environment

export type SimulationType = 'stock_reception' | 'expense_entry' | 'midnight_protocol';

export interface SimulationStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
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
