import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText, Copy, ChevronDown } from 'lucide-react';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';

interface Column<T> {
  key: keyof T;
  label: string;
}

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  filename: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const MONO = 'ui-monospace, SFMono-Regular, monospace';

export function ExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  disabled = false,
  className,
  style,
}: ExportButtonProps<T>) {
  const { t } = useI18n();
  const eb = t.exportButton;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleCSV = () => {
    if (data.length === 0) { toast.error(eb.noData); return; }
    exportToCSV(data, columns, filename);
    toast.success(eb.exported.replace('{count}', String(data.length)));
    setOpen(false);
  };

  const handlePDF = () => {
    // Generate a simple branded text export
    const header = columns.map(c => c.label).join(' | ');
    const rows = data.map(row => columns.map(c => String(row[c.key] ?? '')).join(' | ')).join('\n');
    const content = `Atlas Concrete Morocco — ${filename}\n${'═'.repeat(60)}\n\n${header}\n${'─'.repeat(60)}\n${rows}\n\n${'─'.repeat(60)}\nAtlas Concrete Morocco · Score ESG: A · 0.8T CO₂/mois · Powered by TBOS AI Platform`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace('.csv', '')}.pdf.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export PDF généré');
    setOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Lien copié dans le presse-papier');
    setOpen(false);
  };

  const menuItems = [
    { icon: <FileText size={13} />, label: '📄 Exporter PDF', onClick: handlePDF },
    { icon: <FileSpreadsheet size={13} />, label: '📊 Exporter Excel', onClick: handleCSV },
    { icon: <Copy size={13} />, label: '📋 Copier le lien', onClick: handleCopyLink },
  ];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(o => !o)}
        disabled={disabled || data.length === 0}
        className={className || "gap-2"}
        style={style}
      >
        <FileSpreadsheet className="h-4 w-4" />
        {eb.label}
        <ChevronDown className="h-3 w-3 ml-1" style={{ opacity: 0.5 }} />
      </Button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          zIndex: 200,
          background: '#1A2332',
          border: '1px solid rgba(212,168,67,0.3)',
          borderRadius: 8,
          overflow: 'hidden',
          minWidth: 200,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px',
                fontFamily: MONO, fontSize: 12, color: '#F1F5F9',
                background: 'transparent', border: 'none', cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 100ms',
                borderBottom: i < menuItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
