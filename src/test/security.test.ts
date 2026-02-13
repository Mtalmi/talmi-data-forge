import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeSqlInput, sanitizeInput, sanitizeReason, sanitizeClientName } from '@/lib/security';

describe('Security - XSS Prevention', () => {
  it('encodes HTML entities', () => {
    const malicious = '<script>alert("xss")</script>';
    const result = sanitizeHtml(malicious);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('handles empty strings', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('encodes quotes', () => {
    const input = 'test"onmouseover="alert(1)"';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('"onmouseover');
    expect(result).toContain('&quot;');
  });
});

describe('Security - SQL Injection Prevention', () => {
  it('strips SQL keywords', () => {
    const malicious = "'; DROP TABLE clients; --";
    const result = sanitizeSqlInput(malicious);
    expect(result.toUpperCase()).not.toContain('DROP');
    expect(result).not.toContain('--');
  });

  it('removes dangerous characters', () => {
    const input = "test'; SELECT * FROM users --";
    const result = sanitizeSqlInput(input);
    expect(result).not.toContain("'");
    expect(result).not.toContain(';');
    expect(result).not.toContain('--');
  });

  it('handles empty strings', () => {
    expect(sanitizeSqlInput('')).toBe('');
  });
});

describe('Security - Combined Sanitization', () => {
  it('sanitizes both XSS and SQL in one pass', () => {
    const input = '<img onerror="alert(1)"> ; DROP TABLE --';
    const result = sanitizeInput(input);
    // HTML tags are escaped (XSS safe)
    expect(result).not.toContain('<img');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    // SQL keywords are stripped
    expect(result.toUpperCase()).not.toMatch(/\bDROP\b/);
    expect(result).not.toContain('--');
  });
});

describe('Security - Reason/Note Sanitization', () => {
  it('removes dangerous characters', () => {
    const input = 'Raison valide <script>hack</script>';
    const result = sanitizeReason(input);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('strips javascript: protocol', () => {
    const input = 'javascript:alert(1)';
    const result = sanitizeReason(input);
    expect(result.toLowerCase()).not.toContain('javascript:');
  });

  it('strips event handlers', () => {
    const input = 'test onmouseover=alert(1)';
    const result = sanitizeReason(input);
    expect(result).not.toContain('onmouseover=');
  });

  it('truncates to 500 chars', () => {
    const longInput = 'a'.repeat(600);
    const result = sanitizeReason(longInput);
    expect(result.length).toBeLessThanOrEqual(500);
  });
});

describe('Security - Client Name Sanitization', () => {
  it('cleans dangerous characters from names', () => {
    const input = 'ACME Corp <script>';
    const result = sanitizeClientName(input);
    expect(result).not.toContain('<');
    expect(result).toContain('ACME Corp');
  });

  it('truncates to 200 chars', () => {
    const longInput = 'A'.repeat(300);
    const result = sanitizeClientName(longInput);
    expect(result.length).toBeLessThanOrEqual(200);
  });
});
