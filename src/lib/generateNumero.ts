import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a sequential document number.
 * Tries the Supabase RPC first, falls back to timestamp-based.
 */
export async function generateNumero(prefix: string, tableName: string = 'devis'): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('generate_numero', {
      prefix,
      tbl_name: tableName,
    });
    if (!error && data) return data;
  } catch {
    // Fallback
  }
  // Client-side fallback
  const now = new Date();
  const ym = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `${prefix}-${ym}-${seq}`;
}
