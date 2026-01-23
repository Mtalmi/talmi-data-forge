/**
 * TITANIUM SHIELD - Security Hardening Utilities
 * 
 * This module provides comprehensive security measures including:
 * 1. Input sanitization (XSS/SQL injection prevention)
 * 2. Session timeout management
 * 3. HTTPS enforcement
 * 4. Secure validation schemas
 */

import { z } from 'zod';

// ============================================
// INPUT SANITIZATION - XSS & SQL Injection Prevention
// ============================================

/**
 * Sanitizes a string to prevent XSS attacks by encoding HTML entities
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Removes potentially dangerous SQL injection patterns
 */
export function sanitizeSqlInput(input: string): string {
  if (!input) return '';
  // Remove common SQL injection patterns
  return input
    .replace(/['";\\]/g, '') // Remove quotes, semicolons, backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, '') // Remove block comment end
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b/gi, '') // Remove SQL keywords
    .trim();
}

/**
 * Combined sanitization for user inputs (XSS + SQL)
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return sanitizeSqlInput(sanitizeHtml(input.trim()));
}

/**
 * Validates and sanitizes a reason/note field
 */
export function sanitizeReason(input: string): string {
  if (!input) return '';
  // Allow alphanumeric, spaces, and common punctuation only
  return input
    .replace(/[<>{}[\]\\]/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 500); // Limit length
}

/**
 * Validates and sanitizes a client/company name
 */
export function sanitizeClientName(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>{}[\]\\;'"]/g, '') // Remove dangerous characters
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, 200); // Limit length
}

// ============================================
// ZOD VALIDATION SCHEMAS - Type-safe validation
// ============================================

/**
 * Schema for rollback reason validation
 */
export const rollbackReasonSchema = z.object({
  reason: z
    .string()
    .min(10, 'Le motif doit contenir au moins 10 caractères')
    .max(500, 'Le motif ne peut pas dépasser 500 caractères')
    .refine((val) => !/[<>{}[\]\\]/.test(val), 'Caractères non autorisés détectés')
    .refine((val) => !/javascript:/i.test(val), 'Contenu non autorisé')
    .refine((val) => !/on\w+=/i.test(val), 'Contenu non autorisé')
    .transform((val) => sanitizeReason(val)),
});

/**
 * Schema for client name validation
 */
export const clientNameSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .refine((val) => !/[<>{}[\]\\;'"]/.test(val), 'Caractères non autorisés')
    .transform((val) => sanitizeClientName(val)),
});

/**
 * Generic text input schema
 */
export const safeTextSchema = z
  .string()
  .max(1000, 'Texte trop long')
  .transform((val) => sanitizeInput(val));

// ============================================
// SESSION TIMEOUT CONFIGURATION
// ============================================

export const SESSION_CONFIG = {
  // 2 hours in milliseconds (as requested)
  INACTIVITY_TIMEOUT_MS: 2 * 60 * 60 * 1000, // 2 hours
  // Warning 5 minutes before timeout
  WARNING_BEFORE_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
  // Check interval
  CHECK_INTERVAL_MS: 60 * 1000, // 1 minute
} as const;

// ============================================
// HTTPS ENFORCEMENT
// ============================================

/**
 * Checks if the current connection is secure (HTTPS)
 * Returns true if secure, or if in development mode (localhost)
 */
export function isSecureConnection(): boolean {
  if (typeof window === 'undefined') return true;
  
  const { protocol, hostname } = window.location;
  
  // Allow localhost for development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }
  
  // Require HTTPS in production
  return protocol === 'https:';
}

/**
 * Enforces HTTPS by redirecting if on HTTP in production
 */
export function enforceHttps(): void {
  if (typeof window === 'undefined') return;
  
  const { protocol, hostname, href } = window.location;
  
  // Skip for localhost/development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return;
  }
  
  // Redirect to HTTPS if on HTTP
  if (protocol === 'http:') {
    window.location.href = href.replace('http:', 'https:');
  }
}

// ============================================
// SECURITY HEADERS VALIDATOR
// ============================================

/**
 * Logs security status for debugging (dev only)
 */
export function logSecurityStatus(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group('🛡️ Titanium Shield Security Status');
  console.log('HTTPS:', isSecureConnection() ? '✅ Active' : '⚠️ Insecure');
  console.log('Session Timeout:', `${SESSION_CONFIG.INACTIVITY_TIMEOUT_MS / 1000 / 60} minutes`);
  console.log('Input Sanitization:', '✅ Active');
  console.groupEnd();
}
