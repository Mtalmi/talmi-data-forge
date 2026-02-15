import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import ar from './ar';
import fr from './fr';
import en from './en';

export type Language = 'ar' | 'fr' | 'en';

type Translations = typeof fr;

const translations: Record<Language, Translations> = { ar, fr, en };

const STORAGE_KEY = 'tbos_language';

function detectLanguage(): Language {
  const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (saved && ['ar', 'fr', 'en'].includes(saved)) return saved;

  const browserLangs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const lang of browserLangs) {
    const code = lang.toLowerCase();
    if (code.startsWith('ar')) return 'ar';
    if (code.startsWith('fr')) return 'fr';
    if (code.startsWith('en')) return 'en';
  }

  return 'fr';
}

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectLanguage);

  const setLang = useCallback((newLang: Language) => {
    localStorage.setItem(STORAGE_KEY, newLang);
    setLangState(newLang);
  }, []);

  const isRTL = lang === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [lang, dir, isRTL]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang], isRTL, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

const fallback: I18nContextValue = {
  lang: 'fr',
  setLang: () => {},
  t: translations.fr,
  isRTL: false,
  dir: 'ltr',
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  // Return fallback during HMR/fast-refresh edge cases instead of crashing
  return ctx ?? fallback;
}
