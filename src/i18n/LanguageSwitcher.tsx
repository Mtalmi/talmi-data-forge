import { forwardRef } from 'react';
import { useI18n, Language } from '@/i18n/I18nContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANGUAGES: { code: Language; flag: string; nativeLabel: string; shortLabel: string }[] = [
  { code: 'ar', flag: '🇲🇦', nativeLabel: 'العربية', shortLabel: 'AR' },
  { code: 'fr', flag: '🇫🇷', nativeLabel: 'Français', shortLabel: 'FR' },
  { code: 'en', flag: '🇬🇧', nativeLabel: 'English', shortLabel: 'EN' },
];

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const LangTriggerButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { flag: string; shortLabel: string; nativeLabel?: string; showFull?: boolean }>(
  ({ flag, shortLabel, nativeLabel, showFull, ...props }, ref) => (
    <button
      ref={ref}
      {...props}
      className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium transition-all duration-150 rounded-md"
      style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.15)',
        borderRadius: 6,
        color: '#F59E0B',
      }}
      aria-label="Switch language"
    >
      <span className="text-base leading-none">{flag}</span>
      <span className="text-xs font-bold tracking-wide">{shortLabel}</span>
      {showFull && nativeLabel && (
        <span className="ml-1 text-xs font-medium hidden sm:inline">{nativeLabel}</span>
      )}
    </button>
  )
);
LangTriggerButton.displayName = 'LangTriggerButton';

export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const { lang, setLang } = useI18n();
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <LangTriggerButton
          flag={current.flag}
          shortLabel={current.shortLabel}
          nativeLabel={current.nativeLabel}
          showFull={variant === 'full'}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLang(language.code)}
            className={`gap-3 py-2.5 ${lang === language.code ? 'bg-primary/10 text-primary font-semibold' : ''}`}
          >
            <span className="text-lg">{language.flag}</span>
            <span className="flex-1">{language.nativeLabel}</span>
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground">{language.shortLabel}</span>
            {lang === language.code && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
