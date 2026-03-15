import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { UnitSwitcher } from '@/i18n/UnitSwitcher';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/hooks/useAuth';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { ThemeToggle } from './ThemeToggle';
import { PlantSelector } from './PlantSelector';
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
import { LogOut, Sparkles, Settings } from 'lucide-react';

const MONO = 'ui-monospace, SFMono-Regular, monospace';

/* ── Live clock ── */
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <>{time}</>;
}

interface TopNavBarProps {
  previewRole?: string | null;
  onPreviewRoleChange?: (role: string | null) => void;
}

export function TopNavBar({ previewRole, onPreviewRoleChange }: TopNavBarProps) {
  const { user, role: actualRole, signOut, isCeo: actualIsCeo } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { t } = useI18n();

  const effectiveRole = previewRole || actualRole;
  const initials = user?.email?.charAt(0).toUpperCase() || 'U';

  const iconBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
    background: 'transparent',
    color: '#9CA3AF',
    cursor: 'pointer',
    transition: 'color 200ms',
    border: 'none',
    flexShrink: 0,
  };

  return (
    <header
      className="w-full tbos-top-navbar"
      style={{
        background: '#0F1629',
        borderBottom: '1px solid rgba(212, 168, 67, 0.06)',
        height: 56,
        minHeight: 56,
        maxHeight: 56,
      }}
    >
      <div className="flex items-center justify-between px-6" style={{ height: 56 }}>
        {/* Left — Search */}
        <div className="relative hidden md:block flex-shrink-0">
          <GlobalSearch />
        </div>

        {/* Plant selector */}
        <PlantSelector />

        {/* Center — breathing room */}
        <div className="flex-1" />

        {/* Right — tools + identity — 12px gap between each */}
        <div className="flex items-center flex-shrink-0" style={{ gap: 12 }}>
          {/* Clock */}
          <span
            className="hidden lg:inline"
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: '#9CA3AF',
              letterSpacing: '0.5px',
            }}
          >
            <LiveClock />
          </span>

          {/* Language */}
          <LanguageSwitcher variant="compact" />
          <UnitSwitcher />

          {/* AI sparkle */}
          <button
            style={iconBtnStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
            title="AI Assistant"
          >
            <Sparkles size={16} strokeWidth={1.5} />
          </button>

          {/* Theme toggle */}
          <div className="hidden md:flex">
            <ThemeToggle />
          </div>

          {/* Notifications */}
          <NotificationCenter />

          {/* Settings gear — navigates to /settings */}
          <button
            style={iconBtnStyle}
            onClick={() => {
              const navigate = (window as any).__tbos_navigate;
              if (navigate) navigate('/settings');
              else window.location.href = '/settings';
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
            title="Paramètres"
            className="hidden md:flex"
          >
            <Settings size={16} strokeWidth={1.5} />
          </button>

          {/* Voir comme... dropdown */}
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
                className="relative flex items-center justify-center cursor-pointer transition-all duration-200"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#D4A843',
                  color: '#0F1629',
                  fontFamily: MONO,
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px rgba(212, 168, 67, 0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
              style={{
                background: '#0F1629',
                border: '1px solid rgba(212, 168, 67, 0.15)',
                borderRadius: 8,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <DropdownMenuLabel className="font-normal">
                <p style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }} className="truncate">{user?.email}</p>
                <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '2px', marginTop: 2, color: 'rgba(212,168,67,0.5)', textTransform: 'uppercase' as const }}>
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
