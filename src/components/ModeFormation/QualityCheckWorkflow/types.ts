// Quality Check Workflow Types - Two-Step Validation System
// GOD-TIER: Technical Approval MUST come before Front Desk Validation

export type QualityCheckRole = 
  | 'TECHNICAL_RESPONSIBILITY' // Abdel Sadek, Karim - CAN APPROVE FIRST
  | 'FRONT_DESK'               // Front desk personnel - BLOCKED UNTIL TECH APPROVAL
  | 'MANAGER';                 // Can override/review

export type QualityStatus = 
  | 'conforme'      // ✅ Compliant - can proceed
  | 'a_verifier'    // ⚠️ Needs verification - form required
  | 'non_conforme'; // ❌ Non-compliant - rejection form required

export type WorkflowStatus = 
  | 'awaiting_technical'   // ⏳ Front Desk BLOCKED
  | 'awaiting_frontdesk'   // ✅ Tech approved, Front Desk can validate
  | 'approved'             // ✅ Both steps complete
  | 'rejected';            // ❌ Rejected at any step

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
  workflowStatus: WorkflowStatus;
  technicalCheckComplete: boolean;
  qualityCheck: QualityCheckData | null;
  verificationForm: VerificationFormData | null;
  rejectionForm: RejectionFormData | null;
  validationComplete: boolean;
  confirmedQuantity: number;
  // Two-step tracking
  isFrontDeskBlocked: boolean;
}

// Role access matrix - GOD-TIER ENFORCEMENT
export const ROLE_ACCESS = {
  TECHNICAL_RESPONSIBILITY: {
    canPerformQualityCheck: true,
    canValidate: false,                // CANNOT validate - only approve first
    canFillVerificationForm: false,
    canFillRejectionForm: false,
    canOverride: false,
    canUnblockFrontDesk: true,        // ONLY they can unblock
  },
  FRONT_DESK: {
    canPerformQualityCheck: false,
    canValidate: true,                 // Only if conforme or after form submitted
    canFillVerificationForm: true,
    canFillRejectionForm: true,
    canOverride: false,
    canUnblockFrontDesk: false,       // CANNOT unblock themselves
    mustWaitForTechnical: true,       // CRITICAL: Must wait for tech approval
  },
  MANAGER: {
    canPerformQualityCheck: true,      // Review
    canValidate: true,                 // Override
    canFillVerificationForm: true,     // Review
    canFillRejectionForm: true,        // Review
    canOverride: true,
    canUnblockFrontDesk: true,        // CEO can override
  },
};

// Demo users for simulation
export const DEMO_USERS = {
  ABDEL_SADEK: {
    name: 'Abdel Sadek',
    role: 'TECHNICAL_RESPONSIBILITY' as QualityCheckRole,
    title: 'Resp. Technique',
    isPrimary: true,
    canApproveTechnical: true,
  },
  KARIM: {
    name: 'Karim',
    role: 'TECHNICAL_RESPONSIBILITY' as QualityCheckRole,
    title: 'Superviseur (Backup)',
    isPrimary: false,
    canApproveTechnical: true,
  },
  FRONT_DESK: {
    name: 'Front Desk',
    role: 'FRONT_DESK' as QualityCheckRole,
    title: 'Personnel Accueil',
    isPrimary: true,
    canApproveTechnical: false,
    blockedUntilTechnicalApproval: true,
  },
};

// Blocking messages
export const BLOCKING_MESSAGES = {
  FRONT_DESK_BLOCKED: 'Cette commande doit être approuvée par le Responsable Technique avant validation.',
  AWAITING_TECHNICAL: '⏳ EN ATTENTE APPROBATION TECHNIQUE',
  TECHNICAL_APPROVED: '✅ APPROUVÉ TECHNIQUE - EN ATTENTE VALIDATION',
  COMPLETE: '✅ APPROUVÉE (COMPLÈTE)',
  REJECTED: '❌ REJETÉE',
};
