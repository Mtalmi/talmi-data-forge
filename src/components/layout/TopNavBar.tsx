import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/hooks/useAuth';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { ThemeToggle } from './ThemeToggle';
import { SoundToggle } from './SoundToggle';
import { RolePreviewSwitcher } from './RolePreviewSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';

interface TopNavBarProps {
  previewRole?: string | null;
  onPreviewRoleChange?: (role: string | null) => void;
}

export function TopNavBar({ previewRole, onPreviewRoleChange }: TopNavBarProps) {
  const { user, role: actualRole, signOut, isCeo: actualIsCeo } = useAuth();
  const { t } = useI18n();

  const effectiveRole = previewRole || actualRole;
  const initials = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="w-full tbos-top-navbar" style={{ background: '#0F1629', borderBottom: '1px solid rgba(212, 168, 67, 0.1)' }}>
      <div className="tbos-top-navbar-inner flex items-center justify-between h-14 px-6">
        {/* Left — Search */}
        <div className="relative hidden md:block flex-shrink-0">
          <GlobalSearch />
        </div>

        {/* Center — breathing room */}
        <div className="flex-1" />

        {/* Right — tools + identity */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Tool icons cluster */}
          <div className="flex items-center gap-1">
            <LanguageSwitcher variant="compact" />
            <div className="hidden md:flex"><SoundToggle /></div>
            <div className="hidden md:flex"><ThemeToggle /></div>
            <NotificationCenter />
          </div>

          {/* Divider */}
          <div className="w-px h-5" style={{ background: 'rgba(212,168,67,0.1)' }} />

          {/* Role Preview Switcher - CEO Only */}
          {onPreviewRoleChange && (
            <div className="hidden md:flex">
              <RolePreviewSwitcher
                previewRole={previewRole || null}
                onPreviewRoleChange={onPreviewRoleChange}
              />
            </div>
          )}

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200"
                style={{
                  background: '#D4A843',
                  color: '#0F1629',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
              style={{
                background: '#1a1f2e',
                border: '1px solid rgba(212, 168, 67, 0.15)',
                borderRadius: 8,
              }}
            >
              <DropdownMenuLabel className="font-normal">
                <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }} className="truncate">{user?.email}</p>
                <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '2px', marginTop: 2, color: 'rgba(212,168,67,0.5)', textTransform: 'uppercase' as const }}>
                  {effectiveRole?.replace('_', ' ')}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.05)' }} />
              <DropdownMenuItem onClick={signOut} className="text-red-400/80 cursor-pointer hover:text-red-300 focus:text-red-300">
                <LogOut className="h-4 w-4 mr-2" />
                {t.nav.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
