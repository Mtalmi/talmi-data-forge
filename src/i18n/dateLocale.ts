import { fr } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import type { Language } from './I18nContext';

// date-fns locale mapping
// Arabic uses default (English) locale since date-fns ar locale has limited support
const localeMap: Record<Language, Locale | undefined> = {
  fr,
  ar: undefined,
  en: undefined,
};

export function getDateLocale(lang: Language): Locale | undefined {
  return localeMap[lang];
}

export function getNumberLocale(lang: Language): string {
  switch (lang) {
    case 'ar': return 'ar-MA';
    case 'fr': return 'fr-FR';
    case 'en': return 'en-US';
  }
}
