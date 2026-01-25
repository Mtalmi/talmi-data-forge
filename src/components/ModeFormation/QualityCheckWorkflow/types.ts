// Quality Check Workflow Types - Two-Step Validation System

export type QualityCheckRole = 
  | 'TECHNICAL_RESPONSIBILITY' // Abdel Sadek, Karim
  | 'FRONT_DESK'               // Front desk personnel
  | 'MANAGER';                 // Can override/review

export type QualityStatus = 
  | 'conforme'      // ✅ Compliant - can proceed
  | 'a_verifier'    // ⚠️ Needs verification - form required
  | 'non_conforme'; // ❌ Non-compliant - rejection form required

export type VerificationAction = 
  | 'accept_with_conditions' 
  | 'reject' 
  | 'request_new_inspection';

export type RejectionAction = 
  | 'return_to_supplier' 
  | 'partial_use' 
  | 'additional_inspection';

export interface HumidityTestData {
  photoUploaded: boolean;
  reading: number;
  isHighHumidity: boolean;
}

export interface GravelInspectionData {
  photoUploaded: boolean;
  grade: string;
}

export interface QualityCheckData {
  humidity: HumidityTestData;
  gravel: GravelInspectionData;
  status: QualityStatus;
  notes: string;
  technician: string;
  timestamp: string;
}

export interface VerificationFormData {
  reason: string;
  photoUploaded: boolean;
  recommendedAction: VerificationAction | null;
  notes: string;
  submittedBy: string;
  timestamp: string;
}

export interface RejectionFormData {
  reason: string;
  photoUploaded: boolean;
  recommendedAction: RejectionAction | null;
  notes: string;
  submittedBy: string;
  timestamp: string;
}

export interface StockReceptionOrder {
  id: string;
  supplier: string;
  material: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  date: string;
}

export interface WorkflowState {
  phase: 'technical_check' | 'front_desk_validation';
  technicalCheckComplete: boolean;
  qualityCheck: QualityCheckData | null;
  verificationForm: VerificationFormData | null;
  rejectionForm: RejectionFormData | null;
  validationComplete: boolean;
  confirmedQuantity: number;
}

// Role access matrix
export const ROLE_ACCESS = {
  TECHNICAL_RESPONSIBILITY: {
    canPerformQualityCheck: true,
    canValidate: false,
    canFillVerificationForm: false,
    canFillRejectionForm: false,
    canOverride: false,
  },
  FRONT_DESK: {
    canPerformQualityCheck: false,
    canValidate: true, // Only if conforme or after form submitted
    canFillVerificationForm: true,
    canFillRejectionForm: true,
    canOverride: false,
  },
  MANAGER: {
    canPerformQualityCheck: true, // Review
    canValidate: true,            // Override
    canFillVerificationForm: true, // Review
    canFillRejectionForm: true,    // Review
    canOverride: true,
  },
};

// Demo users for simulation
export const DEMO_USERS = {
  ABDEL_SADEK: {
    name: 'Abdel Sadek',
    role: 'TECHNICAL_RESPONSIBILITY' as QualityCheckRole,
    title: 'Resp. Technique',
    isPrimary: true,
  },
  KARIM: {
    name: 'Karim',
    role: 'TECHNICAL_RESPONSIBILITY' as QualityCheckRole,
    title: 'Superviseur (Backup)',
    isPrimary: false,
  },
  FRONT_DESK: {
    name: 'Front Desk',
    role: 'FRONT_DESK' as QualityCheckRole,
    title: 'Personnel Accueil',
    isPrimary: true,
  },
};
