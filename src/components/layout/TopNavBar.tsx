import { useLocation } from 'react-router-dom';
import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import { LogOut, Settings } from 'lucide-react';

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
    <header className="w-full relative">
      {/* Bottom gold hairline */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px z-10"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(232,184,75,0.15) 20%, rgba(232,184,75,0.08) 80%, transparent 100%)' }}
      />

      <div
        className="flex items-center justify-between h-12 px-4 lg:px-6"
        style={{
          background: 'linear-gradient(90deg, rgba(7,11,18,0.95) 0%, rgba(10,15,25,0.9) 50%, rgba(7,11,18,0.95) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Search — refined capsule */}
        <div className="relative hidden md:block">
          <GlobalSearch />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd
              className="text-[8px] px-1.5 py-0.5 rounded font-mono"
              style={{
                color: 'rgba(232,184,75,0.5)',
                background: 'rgba(232,184,75,0.06)',
                border: '1px solid rgba(232,184,75,0.1)',
              }}
            >⌘</kbd>
            <kbd
              className="text-[8px] px-1.5 py-0.5 rounded font-mono"
              style={{
                color: 'rgba(232,184,75,0.5)',
                background: 'rgba(232,184,75,0.06)',
                border: '1px solid rgba(232,184,75,0.1)',
              }}
            >K</kbd>
          </div>
        </div>

        {/* Right side actions — refined pill cluster */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Action cluster in a subtle capsule */}
          <div
            className="flex items-center gap-0.5 px-1 py-0.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <LanguageSwitcher variant="compact" />
            <div className="hidden md:flex"><SoundToggle /></div>
            <div className="hidden md:flex"><ThemeToggle /></div>
            <NotificationCenter />
          </div>

          {/* Divider */}
          <div className="w-px h-5 mx-1.5" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Role Preview Switcher - CEO Only */}
          {onPreviewRoleChange && (
            <div className="hidden md:flex mr-1">
              <RolePreviewSwitcher
                previewRole={previewRole || null}
                onPreviewRoleChange={onPreviewRoleChange}
              />
            </div>
          )}

          {/* User avatar — gold ring */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold cursor-pointer transition-all duration-300 hover:scale-110 group"
                style={{
                  background: 'linear-gradient(135deg, rgba(232,184,75,0.2), rgba(232,184,75,0.05))',
                  color: 'rgba(232,184,75,0.85)',
                  boxShadow: '0 0 0 1.5px rgba(232,184,75,0.2), 0 0 12px rgba(232,184,75,0.08)',
                }}
              >
                {initials}
                {/* Pulse ring on hover */}
                <span
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    boxShadow: '0 0 0 3px rgba(232,184,75,0.1), 0 0 20px rgba(232,184,75,0.1)',
                  }}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
              style={{
                background: 'rgba(10,15,25,0.95)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(232,184,75,0.1)',
              }}
            >
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium truncate text-white/80">{user?.email}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] mt-0.5" style={{ color: 'rgba(232,184,75,0.5)' }}>
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
