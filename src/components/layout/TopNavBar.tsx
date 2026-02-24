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

  return (
    <header className="w-full">
      <div
        className="flex items-center justify-between h-14 px-4 lg:px-8"
        style={{
          background: 'rgba(15,23,42,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}
      >
        {/* Search with ⌘K hint */}
        <div className="relative hidden md:block">
          <GlobalSearch />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd className="text-[9px] text-slate-600 px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>⌘</kbd>
            <kbd className="text-[9px] text-slate-600 px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>K</kbd>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          <LanguageSwitcher variant="compact" />
          <div className="hidden md:flex"><SoundToggle /></div>
          <div className="hidden md:flex"><ThemeToggle /></div>
          <NotificationCenter />

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
              <button className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold ml-1 cursor-pointer transition-all duration-200 hover:scale-105"
                style={{ background: 'linear-gradient(135deg, rgba(253,185,19,0.25), rgba(253,185,19,0.08))', color: 'rgba(253,185,19,0.8)' }}>
                {user?.email?.charAt(0).toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover/95 backdrop-blur-xl">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{effectiveRole?.replace('_', ' ')}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
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
