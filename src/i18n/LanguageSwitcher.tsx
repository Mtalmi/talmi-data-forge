import { useI18n, Language } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANGUAGES: { code: Language; flag: string; nativeLabel: string }[] = [
  { code: 'ar', flag: '🇲🇦', nativeLabel: 'العربية' },
  { code: 'fr', flag: '🇫🇷', nativeLabel: 'Français' },
  { code: 'en', flag: '🇬🇧', nativeLabel: 'English' },
];

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const { lang, setLang } = useI18n();
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'compact' ? 'icon' : 'sm'}
          className={className}
          aria-label="Switch language"
        >
          <span className="text-base leading-none">{current.flag}</span>
          {variant === 'full' && (
            <span className="ml-2 text-sm font-medium">{current.nativeLabel}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLang(language.code)}
            className={lang === language.code ? 'bg-primary/10 text-primary font-semibold' : ''}
          >
            <span className="mr-2">{language.flag}</span>
            {language.nativeLabel}
            {lang === language.code && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
