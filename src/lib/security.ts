/**
 * TITANIUM SHIELD - Security Hardening Utilities
 * 
 * This module provides comprehensive security measures including:
 * 1. Input sanitization (XSS prevention — strips dangerous HTML/JS patterns)
 * 2. Session timeout management
 * 3. HTTPS enforcement
 * 4. Secure validation schemas
 * 
 * NOTE: SQL injection is NOT handled here because Supabase SDK uses
 * parameterized queries, making SQL injection impossible at the application layer.
 * Previous sanitizeSqlInput was actively corrupting legitimate data (O'Brien → OBrien,
 * & → &amp without semicolon, B25/B30 → garbled encoding).
 */

import { z } from 'zod';

// ============================================
// INPUT SANITIZATION - XSS Prevention
// ============================================

/**
 * Strips dangerous HTML/JS patterns from user input.
 * Does NOT encode HTML entities — React handles that on render.
 * Only removes actual attack vectors: script tags, event handlers, javascript: URIs.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove all HTML tags (but keep content)
    .replace(/<[^>]*>/g, '')
    // Remove javascript: protocol
    .replace(/javascript\s*:/gi, '')
    // Remove event handler attributes (even outside tags, for safety)
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*\S+/gi, '');
}

/**
 * @deprecated Supabase SDK uses parameterized queries — SQL injection is not possible.
 * Kept only for backward compatibility; now just trims input.
 */
export function sanitizeSqlInput(input: string): string {
  if (!input) return '';
  return input.trim();
}

/**
 * Combined sanitization for user inputs (XSS only).
 * Safe for all legitimate text: accents, apostrophes, ampersands, slashes,
 * Arabic/RTL text, emoji, n° symbol, em dashes, etc.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return sanitizeHtml(input.trim());
}

/**
 * Validates and sanitizes a reason/note field.
 * Strips dangerous patterns while preserving legitimate punctuation.
 */
export function sanitizeReason(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript\s*:/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*\S+/gi, '')
    .trim()
    .slice(0, 500); // Limit length
}

/**
 * Validates and sanitizes a client/company name.
 * Allows: accents, apostrophes (O'Brien), ampersands (Béton & Fils),
 * em dashes, parentheses, n° symbol, slashes (B25/B30), Arabic text, emoji.
 * Strips: HTML tags, script injection, event handlers.
 */
export function sanitizeClientName(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript\s*:/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*\S+/gi, '')
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
    .refine((val) => !/<script/i.test(val), 'Contenu non autorisé')
    .refine((val) => !/javascript\s*:/i.test(val), 'Contenu non autorisé')
    .refine((val) => !/\bon\w+\s*=/i.test(val), 'Contenu non autorisé')
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
    .refine((val) => !/<script/i.test(val), 'Caractères non autorisés')
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
