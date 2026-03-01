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
    <header className="w-full tbos-top-navbar">
      <div className="tbos-top-navbar-inner flex items-center justify-between h-14 px-6">
        {/* Left — Search */}
        <div className="relative hidden md:block flex-shrink-0 max-w-[280px]">
          <GlobalSearch />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd
              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{
                color: '#4B5563',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >⌘</kbd>
            <kbd
              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{
                color: '#4B5563',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >K</kbd>
          </div>
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
          <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.05)' }} />

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
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer transition-all duration-200"
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#F59E0B',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.25)')}
              >
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
              style={{
                background: '#1a1f2e',
                border: '1px solid rgba(245, 158, 11, 0.15)',
                borderRadius: 8,
              }}
            >
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium truncate text-white/80">{user?.email}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] mt-0.5 text-amber-500/50">
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
