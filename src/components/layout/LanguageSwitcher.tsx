import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇲🇦' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 px-2 py-2 rounded-xl',
            'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            'transition-all duration-200'
          )}
          aria-label="Change language"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium hidden sm:inline">{current.flag}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-popover/95 backdrop-blur-xl border-border/50">
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              i18n.language === lang.code && 'text-primary font-semibold'
            )}
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
