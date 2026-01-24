import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OCRExtractedData {
  date: string | null;
  supplier: string | null;
  amount: number | null;
  bl_number: string | null;
  items?: Array<{ description: string; quantity?: number; unit?: string }>;
  confidence: number;
  raw_text?: string;
}

export interface VerificationResult {
  isVerified: boolean;
  mismatches: Array<{
    field: string;
    aiValue: string | number | null;
    userValue: string | number | null;
    severity: 'warning' | 'critical';
  }>;
  overallConfidence: number;
}

interface UserEnteredData {
  date?: string;
  supplier?: string;
  amount?: number;
  bl_number?: string;
}

// Tolerance for amount comparison (5% or 50 MAD, whichever is larger)
const AMOUNT_TOLERANCE_PERCENT = 0.05;
const AMOUNT_TOLERANCE_MIN = 50;

/**
 * AI Document Verification Hook
 * Uses Lovable AI (Gemini Vision) to extract and verify document data
 */
export function useAIDocumentVerification() {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<OCRExtractedData | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Scan a document image using AI OCR
   */
  const scanDocument = useCallback(async (
    imageUrl: string,
    documentType: 'stock' | 'expense' = 'stock'
  ): Promise<OCRExtractedData | null> => {
    setIsScanning(true);
    setError(null);
    setExtractedData(null);
    setVerificationResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-document-ocr', {
        body: { image_url: imageUrl, document_type: documentType },
      });

      if (fnError) throw fnError;

      if (!data.success) {
        throw new Error(data.error || 'OCR extraction failed');
      }

      const extracted = data.data as OCRExtractedData;
      setExtractedData(extracted);

      // Show success with confidence indicator
      const confidenceLevel = extracted.confidence >= 80 ? '🟢' : extracted.confidence >= 50 ? '🟡' : '🔴';
      const supplierInfo = extracted.supplier ? ` • ${extracted.supplier}` : '';
      const amountInfo = extracted.amount ? ` • ${extracted.amount.toLocaleString()} MAD` : '';
      
      toast.success(`🤖 AI Scan Terminé - ${confidenceLevel} ${extracted.confidence}%${supplierInfo}${amountInfo}`, {
        duration: 5000,
      });

      return extracted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du scan AI';
      setError(errorMessage);
      
      // Don't show error for rate limits (already handled by edge function)
      if (!errorMessage.includes('Rate limit') && !errorMessage.includes('credits')) {
        toast.error(`🤖 Échec du scan AI: ${errorMessage}`);
      }
      
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  /**
   * Compare AI-extracted data with user-entered data
   * Returns verification result with mismatches
   */
  const verifyAgainstUserData = useCallback((
    aiData: OCRExtractedData,
    userData: UserEnteredData
  ): VerificationResult => {
    const mismatches: VerificationResult['mismatches'] = [];

    // Verify supplier (fuzzy match)
    if (aiData.supplier && userData.supplier) {
      const aiSupplier = aiData.supplier.toLowerCase().trim();
      const userSupplier = userData.supplier.toLowerCase().trim();
      
      // Check if one contains the other or similarity is low
      const containsMatch = aiSupplier.includes(userSupplier) || userSupplier.includes(aiSupplier);
      
      if (!containsMatch && aiSupplier !== userSupplier) {
        mismatches.push({
          field: 'Fournisseur',
          aiValue: aiData.supplier,
          userValue: userData.supplier,
          severity: 'warning',
        });
      }
    }

    // Verify amount (with tolerance)
    if (aiData.amount !== null && userData.amount !== undefined) {
      const tolerance = Math.max(aiData.amount * AMOUNT_TOLERANCE_PERCENT, AMOUNT_TOLERANCE_MIN);
      const difference = Math.abs(aiData.amount - userData.amount);
      
      if (difference > tolerance) {
        mismatches.push({
          field: 'Montant',
          aiValue: aiData.amount,
          userValue: userData.amount,
          severity: difference > aiData.amount * 0.2 ? 'critical' : 'warning',
        });
      }
    }

    // Verify BL number
    if (aiData.bl_number && userData.bl_number) {
      const aiBL = aiData.bl_number.replace(/[-\s]/g, '').toLowerCase();
      const userBL = userData.bl_number.replace(/[-\s]/g, '').toLowerCase();
      
      if (aiBL !== userBL && !aiBL.includes(userBL) && !userBL.includes(aiBL)) {
        mismatches.push({
          field: 'N° BL',
          aiValue: aiData.bl_number,
          userValue: userData.bl_number,
          severity: 'warning',
        });
      }
    }

    // Verify date
    if (aiData.date && userData.date) {
      const aiDate = new Date(aiData.date).toISOString().split('T')[0];
      const userDate = new Date(userData.date).toISOString().split('T')[0];
      
      if (aiDate !== userDate) {
        mismatches.push({
          field: 'Date',
          aiValue: aiData.date,
          userValue: userData.date,
          severity: 'warning',
        });
      }
    }

    const hasCriticalMismatch = mismatches.some(m => m.severity === 'critical');
    const result: VerificationResult = {
      isVerified: mismatches.length === 0,
      mismatches,
      overallConfidence: aiData.confidence,
    };

    setVerificationResult(result);

    // Log mismatch to forensic audit if critical
    if (hasCriticalMismatch) {
      logToForensicAudit(aiData, userData, mismatches);
    }

    return result;
  }, []);

  /**
   * Log critical mismatches to the audit system
   */
  const logToForensicAudit = async (
    aiData: OCRExtractedData,
    userData: UserEnteredData,
    mismatches: VerificationResult['mismatches']
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) return;

      const auditData = {
        action: 'AI_DATA_MISMATCH',
        table_name: 'ai_verification',
        user_id: user.id,
        new_data: JSON.parse(JSON.stringify({
          ai_extracted: aiData,
          user_entered: userData,
          mismatches: mismatches,
          timestamp: new Date().toISOString(),
          blocked: mismatches.some(m => m.severity === 'critical'),
        })),
      };
      await supabase.from('audit_superviseur').insert(auditData);

      console.log('[Forensic] AI Data Mismatch logged to audit');
    } catch (err) {
      console.error('[Forensic] Failed to log mismatch:', err);
    }
  };

  /**
   * Reset verification state
   */
  const reset = useCallback(() => {
    setExtractedData(null);
    setVerificationResult(null);
    setError(null);
  }, []);

  return {
    // State
    isScanning,
    extractedData,
    verificationResult,
    error,
    
    // Actions
    scanDocument,
    verifyAgainstUserData,
    reset,
    
    // Computed
    isVerified: verificationResult?.isVerified ?? null,
    hasCriticalMismatch: verificationResult?.mismatches.some(m => m.severity === 'critical') ?? false,
  };
}
