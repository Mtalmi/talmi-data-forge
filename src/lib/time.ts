/**
 * Time helpers for UI + DB.
 * DB expects `HH:mm` (24h) for `heure_prevue`.
 */

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Normalizes common time inputs to 24h `HH:mm`.
 * Accepts:
 * - "09:00", "09:00:00"
 * - "9:00 AM", "09:00 pm"
 * - "0900"
 */
export function normalizeTimeHHmm(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;

  // 0900
  if (/^\d{4}$/.test(v)) {
    const hh = Number(v.slice(0, 2));
    const mm = Number(v.slice(2, 4));
    if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return `${pad2(hh)}:${pad2(mm)}`;
  }

  // HH:mm or HH:mm:ss
  const hm = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hm) {
    const hh = Number(hm[1]);
    const mm = Number(hm[2]);
    if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return `${pad2(hh)}:${pad2(mm)}`;
  }

  // h:mm AM/PM
  const ampm = v.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (ampm) {
    let hh = Number(ampm[1]);
    const mm = Number(ampm[2]);
    const period = ampm[3].toLowerCase();
    if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
    if (period === 'am') hh = hh % 12;
    if (period === 'pm') hh = (hh % 12) + 12;
    return `${pad2(hh)}:${pad2(mm)}`;
  }

  return null;
}

export function formatTimeHHmm(value: string | null | undefined): string | null {
  if (!value) return null;
  return normalizeTimeHHmm(value);
}

export function timeToMinutes(value: string | null | undefined): number | null {
  const hhmm = formatTimeHHmm(value);
  if (!hhmm) return null;
  const [hh, mm] = hhmm.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}
