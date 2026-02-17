import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { rollbackReasonSchema, clientNameSchema, safeTextSchema } from '@/lib/security';

// =============================================
// Replicate schemas from Auth.tsx & Formules.tsx
// (extracted for pure-logic testing)
// =============================================

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

const passwordStrengthSchema = z.string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule requise')
  .regex(/[0-9]/, 'Au moins un chiffre requis')
  .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial requis (!@#$...)');

const signupSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: passwordStrengthSchema,
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const formuleSchema = z.object({
  formule_id: z.string().min(1, 'ID requis'),
  designation: z.string().min(1, 'Désignation requise'),
  ciment_kg_m3: z.number().min(251, 'Ciment: 251-599 kg/m³').max(599, 'Ciment: 251-599 kg/m³'),
  eau_l_m3: z.number().min(121, 'Eau: 121-219 L/m³').max(219, 'Eau: 121-219 L/m³'),
  adjuvant_l_m3: z.number().min(0, 'Adjuvant >= 0'),
  sable_kg_m3: z.number().min(0).optional(),
  gravier_kg_m3: z.number().min(0).optional(),
  sable_m3: z.number().min(0).optional(),
  gravette_m3: z.number().min(0).optional(),
});

// =============================================
// LOGIN SCHEMA
// =============================================
describe('Zod - Login Schema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'admin@tbos.ma', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '12345' });
    expect(result.success).toBe(false);
  });

  it('rejects empty fields', () => {
    expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false);
  });
});

// =============================================
// SIGNUP SCHEMA
// =============================================
describe('Zod - Signup Schema', () => {
  const validSignup = {
    email: 'user@tbos.ma',
    password: 'Strong1!pass',
    fullName: 'Karim Alaoui',
    confirmPassword: 'Strong1!pass',
  };

  it('accepts valid signup', () => {
    expect(signupSchema.safeParse(validSignup).success).toBe(true);
  });

  it('rejects password without uppercase', () => {
    const result = signupSchema.safeParse({ ...validSignup, password: 'strong1!pass', confirmPassword: 'strong1!pass' });
    expect(result.success).toBe(false);
  });

  it('rejects password without digit', () => {
    const result = signupSchema.safeParse({ ...validSignup, password: 'Strong!pass', confirmPassword: 'Strong!pass' });
    expect(result.success).toBe(false);
  });

  it('rejects password without special char', () => {
    const result = signupSchema.safeParse({ ...validSignup, password: 'Strong1pass', confirmPassword: 'Strong1pass' });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = signupSchema.safeParse({ ...validSignup, confirmPassword: 'Different1!' });
    expect(result.success).toBe(false);
  });

  it('rejects single-char full name', () => {
    const result = signupSchema.safeParse({ ...validSignup, fullName: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects password under 8 chars', () => {
    const result = signupSchema.safeParse({ ...validSignup, password: 'Ab1!xyz', confirmPassword: 'Ab1!xyz' });
    expect(result.success).toBe(false);
  });
});

// =============================================
// FORMULE SCHEMA
// =============================================
describe('Zod - Formule Schema', () => {
  const validFormule = {
    formule_id: 'B25-S3',
    designation: 'Béton B25',
    ciment_kg_m3: 350,
    eau_l_m3: 175,
    adjuvant_l_m3: 2.5,
  };

  it('accepts valid formule', () => {
    expect(formuleSchema.safeParse(validFormule).success).toBe(true);
  });

  it('rejects ciment below 251', () => {
    expect(formuleSchema.safeParse({ ...validFormule, ciment_kg_m3: 250 }).success).toBe(false);
  });

  it('rejects ciment above 599', () => {
    expect(formuleSchema.safeParse({ ...validFormule, ciment_kg_m3: 600 }).success).toBe(false);
  });

  it('rejects eau below 121', () => {
    expect(formuleSchema.safeParse({ ...validFormule, eau_l_m3: 120 }).success).toBe(false);
  });

  it('rejects eau above 219', () => {
    expect(formuleSchema.safeParse({ ...validFormule, eau_l_m3: 220 }).success).toBe(false);
  });

  it('rejects negative adjuvant', () => {
    expect(formuleSchema.safeParse({ ...validFormule, adjuvant_l_m3: -1 }).success).toBe(false);
  });

  it('rejects empty formule_id', () => {
    expect(formuleSchema.safeParse({ ...validFormule, formule_id: '' }).success).toBe(false);
  });

  it('accepts optional sable/gravier fields', () => {
    expect(formuleSchema.safeParse({ ...validFormule, sable_kg_m3: 800, gravier_kg_m3: 1050 }).success).toBe(true);
  });
});

// =============================================
// SECURITY SCHEMAS (from security.ts)
// =============================================
describe('Zod - Rollback Reason Schema', () => {
  it('rejects reason shorter than 10 chars', () => {
    expect(rollbackReasonSchema.safeParse({ reason: 'short' }).success).toBe(false);
  });

  it('accepts valid reason', () => {
    expect(rollbackReasonSchema.safeParse({ reason: 'Annulation demandée par le client pour retard' }).success).toBe(true);
  });

  it('rejects reason with HTML tags', () => {
    expect(rollbackReasonSchema.safeParse({ reason: '<script>alert("xss")</script> raison valide' }).success).toBe(false);
  });

  it('rejects reason with javascript: protocol', () => {
    expect(rollbackReasonSchema.safeParse({ reason: 'javascript:alert(1) some more text here' }).success).toBe(false);
  });

  it('rejects reason longer than 500 chars', () => {
    expect(rollbackReasonSchema.safeParse({ reason: 'a'.repeat(501) }).success).toBe(false);
  });
});

describe('Zod - Client Name Schema', () => {
  it('accepts valid client name', () => {
    expect(clientNameSchema.safeParse({ name: 'ACME Construction SARL' }).success).toBe(true);
  });

  it('rejects single char', () => {
    expect(clientNameSchema.safeParse({ name: 'A' }).success).toBe(false);
  });

  it('rejects name with angle brackets', () => {
    expect(clientNameSchema.safeParse({ name: 'ACME <script>' }).success).toBe(false);
  });

  it('rejects name exceeding 200 chars', () => {
    expect(clientNameSchema.safeParse({ name: 'A'.repeat(201) }).success).toBe(false);
  });
});

describe('Zod - Safe Text Schema', () => {
  it('rejects text longer than 1000 chars', () => {
    expect(safeTextSchema.safeParse('a'.repeat(1001)).success).toBe(false);
  });

  it('accepts and sanitizes valid text', () => {
    const result = safeTextSchema.safeParse('Livraison prévue demain');
    expect(result.success).toBe(true);
  });
});
