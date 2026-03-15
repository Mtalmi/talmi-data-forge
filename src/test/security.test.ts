import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeSqlInput, sanitizeInput, sanitizeReason, sanitizeClientName } from '@/lib/security';

describe('Security - XSS Prevention', () => {
  it('strips script tags', () => {
    const malicious = '<script>alert("xss")</script>';
    const result = sanitizeHtml(malicious);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  it('strips HTML tags but keeps text', () => {
    const input = '<b>bold</b> text';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<b>');
    expect(result).toContain('bold');
    expect(result).toContain('text');
  });

  it('handles empty strings', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('strips event handlers', () => {
    const input = 'test onmouseover="alert(1)" rest';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onmouseover');
  });

  it('strips javascript: protocol', () => {
    const input = 'javascript:alert(1)';
    const result = sanitizeHtml(input);
    expect(result.toLowerCase()).not.toContain('javascript:');
  });
});

describe('Security - SQL Injection Prevention (deprecated)', () => {
  it('no longer strips SQL keywords (Supabase uses parameterized queries)', () => {
    const input = "O'Brien";
    const result = sanitizeSqlInput(input);
    // Apostrophe should be preserved — SQL injection is prevented by parameterized queries
    expect(result).toContain("O'Brien");
  });

  it('handles empty strings', () => {
    expect(sanitizeSqlInput('')).toBe('');
  });
});

describe('Security - Combined Sanitization', () => {
  it('strips XSS but preserves legitimate text', () => {
    const input = '<img onerror="alert(1)"> Hello World';
    const result = sanitizeInput(input);
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
    expect(result).toContain('Hello World');
  });

  it('preserves accents and special chars', () => {
    const input = "Béton & Fils — Casablanca (Groupe n°1)";
    const result = sanitizeInput(input);
    expect(result).toBe("Béton & Fils — Casablanca (Groupe n°1)");
  });

  it('preserves apostrophes', () => {
    const result = sanitizeInput("O'Brien Construction");
    expect(result).toBe("O'Brien Construction");
  });

  it('preserves slashes', () => {
    const result = sanitizeInput("B25/B30");
    expect(result).toBe("B25/B30");
  });

  it('preserves special note chars', () => {
    const result = sanitizeInput("Prix spécial: 850 DH/m³ — voir contrat #2024-001");
    expect(result).toBe("Prix spécial: 850 DH/m³ — voir contrat #2024-001");
  });

  it('preserves Arabic text', () => {
    const arabic = "شركة الإنشاءات المغربية";
    const result = sanitizeInput(arabic);
    expect(result).toBe(arabic);
  });

  it('preserves emoji', () => {
    const result = sanitizeInput("Atlas Concrete 🏗️");
    expect(result).toBe("Atlas Concrete 🏗️");
  });

  it('preserves plus sign in email context', () => {
    const result = sanitizeInput("user+tag@company.co.ma");
    expect(result).toBe("user+tag@company.co.ma");
  });
});

describe('Security - Reason/Note Sanitization', () => {
  it('strips HTML tags from notes', () => {
    const input = 'Raison valide <script>hack</script>';
    const result = sanitizeReason(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('Raison valide');
  });

  it('strips javascript: protocol', () => {
    const input = 'javascript:alert(1)';
    const result = sanitizeReason(input);
    expect(result.toLowerCase()).not.toContain('javascript:');
  });

  it('strips event handlers', () => {
    const input = 'test onmouseover="alert(1)"';
    const result = sanitizeReason(input);
    expect(result).not.toContain('onmouseover=');
  });

  it('truncates to 500 chars', () => {
    const longInput = 'a'.repeat(600);
    const result = sanitizeReason(longInput);
    expect(result.length).toBeLessThanOrEqual(500);
  });

  it('preserves legitimate punctuation in notes', () => {
    const input = "Prix spécial: 850 DH/m³ — voir contrat #2024-001";
    const result = sanitizeReason(input);
    expect(result).toBe(input);
  });
});

describe('Security - Client Name Sanitization', () => {
  it('strips HTML tags from names', () => {
    const input = 'ACME Corp <script>alert(1)</script>';
    const result = sanitizeClientName(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('ACME Corp');
  });

  it('preserves apostrophes in names', () => {
    const result = sanitizeClientName("O'Brien Construction");
    expect(result).toBe("O'Brien Construction");
  });

  it('preserves ampersands in names', () => {
    const result = sanitizeClientName("Béton & Fils");
    expect(result).toBe("Béton & Fils");
  });

  it('preserves complex Moroccan company names', () => {
    const input = "Béton & Fils — Casablanca (Groupe n°1)";
    const result = sanitizeClientName(input);
    expect(result).toBe(input);
  });

  it('preserves Arabic text', () => {
    const arabic = "شركة الإنشاءات المغربية";
    const result = sanitizeClientName(arabic);
    expect(result).toBe(arabic);
  });

  it('preserves emoji', () => {
    const result = sanitizeClientName("Atlas Concrete 🏗️");
    expect(result).toBe("Atlas Concrete 🏗️");
  });

  it('truncates to 200 chars', () => {
    const longInput = 'A'.repeat(300);
    const result = sanitizeClientName(longInput);
    expect(result.length).toBeLessThanOrEqual(200);
  });

  it('renders HTML injection as plain text', () => {
    const result = sanitizeClientName('<b>bold</b>');
    expect(result).not.toContain('<b>');
    expect(result).toContain('bold');
  });
});
