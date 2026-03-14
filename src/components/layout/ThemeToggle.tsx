import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <button
        className="relative flex items-center justify-center"
        style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#9CA3AF', border: 'none' }}
        aria-label="Toggle theme"
      >
        <Sun size={16} strokeWidth={1.5} />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative flex items-center justify-center cursor-pointer transition-colors duration-200"
      style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#9CA3AF', border: 'none' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
    </button>
  );
}
